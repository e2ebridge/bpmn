/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var util = require('util');
var _s = require('underscore.string');
var definitions = require('./parsing/definitions.js');
var handler = require('./handler.js');
var processCache = require('./processCache.js');
var log = require('./logger.js');

var transactionLog = null;
try {
    transactionLog = require('e2e-transaction-logger');
}catch(err){
    transactionLog = null;
}

var EventEmitter = require('events').EventEmitter;
var BPMNProcessState = require("./state.js").BPMNProcessState;
var BPMNProcessHistory = require("./history.js").BPMNProcessHistory;
var BPMNProcessClient = require("./client.js").BPMNProcessClient;
var BPMNPendingTimerEvents = require("./timeouts.js").BPMNPendingTimerEvents;

var activityEndHandlerPostfix = require('./parsing/activity.js').activityEndHandlerPostfix;

var TOKEN_ARRIVED_EVENT = "TOKEN_ARRIVED_EVENT";
var ACTIVITY_END_EVENT = "ACTIVITY_END_EVENT";
var INTERMEDIATE_CATCH_EVENT = "INTERMEDIATE_CATCH_EVENT";
var BOUNDARY_CATCH_EVENT = "BOUNDARY_CATCH_EVENT";


exports.clearCache = processCache.clear;
exports.getById = processCache.get;
exports.findByProperty = processCache.findByProperty;
exports.findByState = processCache.findByState;
exports.findByName = processCache.findByName;

/**
 * Internal creation or get method. If the process has been already created it will just be fetched from the cache
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @param {Function=} callback
 * @return {BPMNProcess}
 */
var createOrGetBPMNProcess = exports.createOrGetBPMNProcess = function(id, processDefinition, eventHandler,
                                                                       persistency, parentProcess, parentToken,
                                                                       callback) {
    var bpmnProcess = processCache.get(id);

    if(typeof persistency === 'function' ){
        callback = persistency;
        persistency = null;
        parentProcess = null;
        parentToken = null;
    } else if(typeof parentProcess === 'function' ){
        callback = parentProcess;
        parentProcess = null;
        parentToken = null;
    } else if(typeof parentToken === 'function' ){
        callback = parentToken;
        parentToken = null;
    }

    if (!bpmnProcess) {
        bpmnProcess = createBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, callback);
        processCache.set(bpmnProcess.processId, bpmnProcess);
    }else{
        if(callback){
            callback(null, bpmnProcess);
        }
    }

    return bpmnProcess;
};

exports.createBPMNProcess4Testing = function createBPMNProcess4Testing(id, processDefinition, eventHandler, persistency,
                                                                       parentProcess, parentToken, callback) {
    // We have to delete the cache otherwise we might take an old version of this process$
    // which might lead to very confusing situations while testing similar processes.
    processCache.clear();
    return createOrGetBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, callback);
};

/**
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @param {HistoryEntry=} parentHistoryEntry
 * @param {Function=} callback
 * @return {BPMNProcess}
 */
function createBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistoryEntry, callback) {
    var bpmnProcess;

    if(typeof persistency === 'function' ){
        callback = persistency;
        persistency = null;
        parentProcess = null;
        parentToken = null;
        parentHistoryEntry = null;
    } else if(typeof parentProcess === 'function' ){
        callback = parentProcess;
        parentProcess = null;
        parentToken = null;
        parentHistoryEntry = null;
    } else if(typeof parentToken === 'function' ){
        callback = parentToken;
        parentToken = null;
        parentHistoryEntry = null;
    } else if(typeof parentHistoryEntry === 'function' ){
        callback = parentHistoryEntry;
        parentHistoryEntry = null;
    }

    bpmnProcess = new BPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistoryEntry);

    if (bpmnProcess.isMainProcess()) {
        // we save all process information - including called processes - in one document
        bpmnProcess.loadPersistedData(function(err){
            if(callback){
                callback(err, bpmnProcess);
            }
        });
    } else {
        if(callback){
            callback(null, bpmnProcess);
        }
    }

    return bpmnProcess;
}

/**
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @param {HistoryEntry=} parentHistoryEntry
 * @constructor
 */
function BPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistoryEntry) {
    var self = this;
    var defaultEventHandler, defaultErrorHandler;

    this.processId = id;
    this.processDefinition = processDefinition;
    this.eventHandler = eventHandler;
    this.parentProcess = parentProcess;
    this.pendingTimerEvents = new BPMNPendingTimerEvents(this);
    this.persistency = persistency;
    this.deferredEvents = [];
    this.deferEvents = false; // events must be deferred if the process engine is loading or saving state
    this.processClient = new BPMNProcessClient(this);
    this.participantIds = {}; // if the process takes part in a collaboration, we store all participant process ids in this map
    this.properties = {}; // TODO: how do we handle parent data?
    this.calledProcesses = {};
    this.logger = new log.Logger(this, {logLevel: log.logLevels.error});
    if(transactionLog) {
        this.transactionLogger = new transactionLog.TransactionLogger();
    }
    this.currentTrx = null;
    this.views = {
        startEvent : null,
        endEvent : null,
        duration : null
    };

    if (parentToken) {
        this.state = new BPMNProcessState(parentToken.substate);
        parentToken.substate = this.state;
        this.parentToken = parentToken;
    } else {
        this.state = new BPMNProcessState();
    }

    if (parentHistoryEntry) {
        this.history = new BPMNProcessHistory(parentHistoryEntry.subhistory);
        parentHistoryEntry.subhistory = this.history;
    } else {
        this.history = new BPMNProcessHistory();
    }

    defaultErrorHandler = logDefaultedErrors;
    defaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason, done) {
        if (done) {
            done.call(self.processClient);
        }
    };

    eventHandler = eventHandler || {};
    this.defaultEventHandler = eventHandler.defaultEventHandler || defaultEventHandler;
    this.defaultErrorHandler = eventHandler.defaultErrorHandler || defaultErrorHandler;
    this.doneSavingHandler = eventHandler.doneSavingHandler;
    this.doneLoadingHandler = eventHandler.doneLoadingHandler;
    this.onBeginHandler = eventHandler.onBeginHandler;
    this.onEndHandler = eventHandler.onEndHandler;

    this._registerOnTokenArrivedEvent();
    this._registerActivityEndEvents();
    this._registerThrowIntermediateEvents();
    this._registerThrowBoundaryEvents();
}
util.inherits(BPMNProcess, EventEmitter);

/**
 * @returns {Boolean}
 */
BPMNProcess.prototype.isMainProcess = function() {
    return  (this.parentProcess === undefined || this.parentProcess === null);
};

/**
 * @returns {BPMNProcessDefinition}
 */
BPMNProcess.prototype.getProcessDefinition = function() {
    return this.processDefinition;
};

/**
 * @returns {String}
 */
BPMNProcess.prototype.getProcessId = function() {
    return this.processId;
};

/**
 * @param {Logger} logger
 */
BPMNProcess.prototype.setLogger = function(logger) {
    this.logger = logger;
};

/**
 * @param {number | string} logLevel
 */
BPMNProcess.prototype.setLogLevel = function(logLevel) {
    this.logger.setLogLevel(logLevel);
};

/**
 * @param {function(string)} logAppender
 */
BPMNProcess.prototype.setLogAppender = function(logAppender) {
    this.logger.logAppender = logAppender;
};

/**
 * Add winston log transport (semantic like winston add() [https://github.com/flatiron/winston])
 * @param winstonTransport
 * @param options
 */
BPMNProcess.prototype.addLogTransport = function(winstonTransport, options) {
    this.logger.addTransport(winstonTransport, options);
};

/**
 * Remove winston log transport (semantic like winston remove() [https://github.com/flatiron/winston])
 * @param winstonTransport
 */
BPMNProcess.prototype.removeLogTransport = function(winstonTransport) {
    this.logger.removeTransport(winstonTransport);
};

/**
 * @returns {Transaction}
 */
BPMNProcess.prototype.getCurrentTrx = function() {
    return this.currentTrx;
};

/**
 * @param {String} eventName
 * @param {Object=} data
 */
BPMNProcess.prototype.triggerEvent = function(eventName, data) {
    var self = this;
    var processDefinition = self.processDefinition;
    var flowObjectName = eventName;
    var flowObject = processDefinition.getFlowObjectByName(flowObjectName);
    var taskDoneMatch = _s.endsWith(eventName, activityEndHandlerPostfix);

    if (flowObject) {

        this.logger.trace("Trigger " + flowObject.type + " '" + flowObject.name + "'", data);

        if (flowObject.isStartEvent) {
            if (self.history.hasBeenVisited(eventName)) {
                 throw new Error("The start event '" + eventName + "' cannot start an already started process.");
            } else {
                // start events create a token and put it on the first occurrence
                self._putTokenAt(flowObject, data);
            }
        } else if (flowObject.isIntermediateCatchEvent) {
            process.nextTick(function() {
                // We need this to achieve parallel collaborating processes
                // TODO: however, it is not completely clear to me whether this works in all circumstances
                self._emitEvent(INTERMEDIATE_CATCH_EVENT, eventName, data);
            });
        } else if (flowObject.isBoundaryEvent) {
            self._emitEvent(BOUNDARY_CATCH_EVENT, eventName, data);
        } else {
            throw new Error("The process '" + processDefinition.name + "' has no intermediate catch event for '" + eventName + "'");
        }
    } else if (taskDoneMatch){
        flowObjectName = _s.strLeft(eventName, activityEndHandlerPostfix);
        flowObject = processDefinition.getFlowObjectByName(flowObjectName);

        if(flowObject && flowObject.isWaitTask){
            self.taskDone(flowObjectName, data);
        }else{
            throw new Error("The process '" + processDefinition.name + "' does not know the event '" + eventName + "'");
        }
    } else {
        throw new Error("The process '" + processDefinition.name + "' does not know the event '" + eventName + "'");
    }
 };

/**
 * Send a message by name to this process or along a message flow
 * @param {BPMNMessageFlow | String} messageFlow
 * @param {Object=} data
 */
BPMNProcess.prototype.sendMessage = function(messageFlow, data) {
    var partnerProcess, targetFlowObject, sourceFlowObject;

    if (typeof messageFlow === 'string') {
        this.triggerEvent(messageFlow, data);
    } else {
        if (messageFlow.targetProcessDefinitionId) {
            partnerProcess = this.getParticipantById(messageFlow.targetProcessDefinitionId);
            targetFlowObject = partnerProcess.processDefinition.getFlowObject(messageFlow.targetRef);
            sourceFlowObject = this.processDefinition.getSourceFlowObject(messageFlow);

            this.logger.trace("Sending '" +
                messageFlow.name + "' from '" +
                sourceFlowObject.name + "' to '" +
                targetFlowObject.name + "'.", data);

            partnerProcess.triggerEvent(targetFlowObject.name, data);

        } else {
            throw new Error("sendMessage: the '" + messageFlow.name + "' has no targetProcessDefinitionId. Is the message flow target an executable pool?");
        }
    }
};

/**
 * @param {String} taskName
 * @param {Object} data
 */
BPMNProcess.prototype.taskDone = function(taskName, data) {
    this.logger.trace("Task '" + taskName + "' done.", data);
    this.emitActivityEndEvent(taskName, data);
};

/**
 * @param {String} participantName
 * @return {BPMNProcess}
 */
BPMNProcess.prototype.getParticipantByName = function(participantName, callback) {
    var participatingProcessId = this.participantIds[participantName];
    var participant = this.processDefinition.getParticipantByName(participantName);
    var participatingProcessDefinition = definitions.getBPMNProcessDefinitions(participant.bpmnFileName);

    return createOrGetBPMNProcess(participatingProcessId, participatingProcessDefinition, this.eventHandler, this.persistency, callback);
};

/**
 * @param {String} processDefinitionId
 * @return {BPMNProcess}
 */
BPMNProcess.prototype.getParticipantById = function(processDefinitionId, callback) {
    var participant = this.processDefinition.getParticipantById(processDefinitionId);
    var participatingProcessId = this.participantIds[participant.name];
    var participatingProcessDefinition = definitions.getBPMNProcessDefinitions(participant.bpmnFileName);

    return createOrGetBPMNProcess(participatingProcessId, participatingProcessDefinition, this.eventHandler, this.persistency, callback);
};

/**
 * @param {String} participantName
 * @param {String} processId
  */
BPMNProcess.prototype.addParticipantId = function(participantName, processId) {
    this.participantIds[participantName] = processId;
};

/**
 * @return {BPMNProcess}
 */
BPMNProcess.prototype.getParentProcess = function() {
    return this.parentProcess;
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object=} data
 */
BPMNProcess.prototype._putTokenAt = function(currentFlowObject, data) {
    var self = this;
    var name = currentFlowObject.name;

    self.state.createTokenAt(name, self.processId);
    self.logger.debug("Token was put on '" + name + "'", data);
    self.onFlowObjectBegin(currentFlowObject, data, function() {
        self._emitEvent(TOKEN_ARRIVED_EVENT, name, data);
    });
};

/**
 * @param {String} currentFlowObjectName
 * @param {Function} done
 */
BPMNProcess.prototype._notifyBPMNEditor = function(currentFlowObjectName, done) {
    var self = this;
    var debuggerInterface = self.processDefinition.debuggerInterface;
    var flowObject = self.processDefinition.getFlowObjectByName(currentFlowObjectName);
    if (debuggerInterface && flowObject) {
        debuggerInterface.sendPosition(flowObject, self.logger, done);
    } else {
        done();
    }
};

/**
 * @param {Function} done
 * @private
 */
BPMNProcess.prototype._clearBPMNEditorState = function(done) {
    var self = this;
    var debuggerInterface = self.processDefinition.debuggerInterface;
    if (debuggerInterface) {
        debuggerInterface.sendPosition({}, self.logger, done);
    } else {
        done();
    }
};


/**
 * @param {Function} callback
 */
BPMNProcess.prototype.onTokenArrivedEvent = function(callback) {
    this.on(TOKEN_ARRIVED_EVENT, callback);
};

/**
 * @return {BPMNProcessState}
 */
BPMNProcess.prototype.getState = function() {
    return this.state;
};

/**
 * @return {BPMNProcessHistory}
 */
BPMNProcess.prototype.getHistory = function() {
    return this.history;
};

/**
 * @return {*}
 */
BPMNProcess.prototype.getProperties = function() {
    return this.properties;
};

/**
 * @param {Boolean=} closeConnection
 */
BPMNProcess.prototype.persist = function(closeConnection) {
    var mainProcess, doneSaving, persistentData;
    var persistency = this.persistency;

    if (persistency) {
        this.setDeferEvents(true);
        mainProcess = this.getMainProcess();
        doneSaving = function(error, savedData) {
            if (error) {
                mainProcess.logger.error("Cannot persist process '" + mainProcess.processId +
                    "'. Process name: '" + mainProcess.processDefinition.name + "'. Error: " + error);

                if (mainProcess.doneSavingHandler) {
                    mainProcess.doneSavingHandler.call(mainProcess.processClient, error);
                }
            } else {
                if (mainProcess.doneSavingHandler) {
                    mainProcess.doneSavingHandler.call(mainProcess.processClient, null, savedData);
                }

                mainProcess.logger.debug("SavedData: ", savedData);

                if (closeConnection) {
                    persistency.close(function() {
                        mainProcess._emitDeferredEvents();
                    });
                } else {
                    mainProcess._emitDeferredEvents();
                }
            }
         };

        persistentData = {
            processName: mainProcess.processDefinition.name,
            processId: mainProcess.processId,
            parentToken: mainProcess.parentToken || null,
            properties: mainProcess.properties,
            state: mainProcess.state,
            history: mainProcess.history,
            pendingTimeouts: mainProcess.pendingTimerEvents.pendingTimeouts,
            views: mainProcess.views
        };
        persistency.persist(persistentData, doneSaving);
    }
};

/**
 * If we have a persistency layer that requires db connections, they are closed.
 * @param {Function} done
 */
BPMNProcess.prototype.closeConnection = function(done) {
    var persistency = this.persistency;
    if (persistency) {
        persistency.close(done);
    }
};


/**
 * @returns {BPMNProcess}
 */
BPMNProcess.prototype.getMainProcess = function() {
    var mainProcess;
    if (this.parentProcess) {
        mainProcess = this.parentProcess.getMainProcess();
    } else {
        mainProcess = this;
    }
    return mainProcess;
};

/**
 * @returns {Boolean}
 */
BPMNProcess.prototype.hasToDeferEvents = function() {
    var mainProcess = this.getMainProcess();
    return mainProcess.deferEvents;
 };

/**
 * @param {Boolean} deferEvents
 */
BPMNProcess.prototype.setDeferEvents = function(deferEvents) {
    var mainProcess = this.getMainProcess();
    mainProcess.deferEvents = deferEvents;
};

/**
 */
BPMNProcess.prototype.loadPersistedData = function(callback) {
    var mainProcess, processId, processName, doneLoading;

    if(typeof callback !== 'function'){
        callback = function(){};
    }

    if (this.persistency) {
        this.setDeferEvents(true);
        mainProcess = this.getMainProcess();
        processId = mainProcess.processId;
        processName = mainProcess.processDefinition.name;
        doneLoading = function(error, loadedData) {

            if (error) {
                mainProcess.logger.error("Cannot load process '" + mainProcess.processId +
                    "'. Process name: '" + processName + "'. Error: " + error);
                if (mainProcess.doneLoadingHandler) {
                    mainProcess.doneLoadingHandler.call(mainProcess.processClient, error, loadedData);
                }
            } else {
                if (loadedData) {
                    mainProcess.setPersistedData(loadedData);
                    mainProcess.createCalledProcesses();
                    if (mainProcess.doneLoadingHandler) {
                        mainProcess.doneLoadingHandler.call(mainProcess.processClient, error, loadedData);
                    }
                }
                mainProcess._emitDeferredEvents();
            }

            callback(error, loadedData);
        };
        mainProcess.persistency.load(processId, processName, doneLoading);
    }else{
        callback();
    }

};

/**
 */
BPMNProcess.prototype.createCalledProcesses = function() {
    var callActivityName, callActivity, calledProcess;
    var self = this;
    var callActivityTokens = self.state.findCallActivityTokens();

    callActivityTokens.forEach(function(callActivityToken) {
        callActivityName = callActivityToken.position;
        callActivity = self.processDefinition.getFlowObjectByName(callActivityName);
        calledProcess = callActivity.createCalledProcess(callActivityToken, self, createBPMNProcess);
        calledProcess.createCalledProcesses();
    });
};

BPMNProcess.prototype.setPersistedData = function(loadedData) {
    this.state = new BPMNProcessState(loadedData.state);
    this.history = new BPMNProcessHistory(loadedData.history);
    this.pendingTimerEvents = new BPMNPendingTimerEvents(this);
    this.pendingTimerEvents.restoreTimerEvents(loadedData.pendingTimeouts);
    this.properties = loadedData.properties || {};
};

/**
 * @param {String} name
 * @param {Object} value
 */
BPMNProcess.prototype.setProperty = function(name, value) {
    this.properties[name] = value;
};

/**
 * @param {String} name
 * @return {Object}
 */
BPMNProcess.prototype.getProperty = function(name) {
    return this.properties[name];
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object} data
 * @param {Boolean=} returningFromCalledProcess
 * @private
 */
BPMNProcess.prototype._emitTokens = function(currentFlowObject, data, returningFromCalledProcess) {
    var activity;
    var self = this;

    self.state.removeTokenAt(currentFlowObject);

    if (currentFlowObject.isBoundaryEvent) {
        activity = self.processDefinition.getFlowObject(currentFlowObject.attachedToRef);
        self._clearBoundaryTimerEvents(activity);
        self.state.removeTokenAt(activity);
        self.onFlowObjectEnd(activity.name);
    } else {
        self._clearBoundaryTimerEvents(currentFlowObject);
    }

    if (currentFlowObject.isCallActivity || currentFlowObject.isSubProcess) {
        currentFlowObject.emitTokens(self, data, createBPMNProcess, returningFromCalledProcess);
    } else {
        currentFlowObject.emitTokens(self, data);
    }
};

/**
 * @param {String} eventName
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype.emitActivityEndEvent = function(eventName, data) {
    this._emitEvent(ACTIVITY_END_EVENT, eventName, data);
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @param {BPMNSequenceFlow} outgoingSequenceFlow
 * @param {Object} data
 */
BPMNProcess.prototype.emitTokenAlong = function(currentFlowObject, outgoingSequenceFlow, data) {
    var nextFlowObject = this.processDefinition.getProcessElement(outgoingSequenceFlow.targetRef);
    this._putTokenAt(nextFlowObject, data);
};

/**
 * @returns {Boolean}
 */
BPMNProcess.prototype.isDebuggerEnabled = function() {
    var debuggerInterface = this.processDefinition.debuggerInterface;
    return (debuggerInterface && debuggerInterface.isInDebugger());
};

/**
 * Called on begin of activities, task, catch events, etc.
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object} data
 * @param {Function} done
 * @private
 */
BPMNProcess.prototype.onFlowObjectBegin = function(currentFlowObject, data, done) {
    var self = this;
    var name = currentFlowObject.name;

    var finished = function() {
        if (self.onBeginHandler) {
            self.onBeginHandler.call(self.processClient, name, data, function() {
                done();
            });
        } else {
            done();
        }
    };

    self.history.addEntry(currentFlowObject);

    if(currentFlowObject.isStartEvent) {
        self.views.startEvent = self.history.historyEntries[0];
    }

    if (self.isDebuggerEnabled()) {
        this._notifyBPMNEditor(name, finished);
    } else {
        finished();
    }
};

/**
 * Called on end of activities, task, catch events, etc.
 * @param {String} currentFlowObjectName
 * @param {Object=} data
 * @param {Function=} done
 */
BPMNProcess.prototype.onFlowObjectEnd = function(currentFlowObjectName, data, done) {
    var self = this;
    var history = self.history;

    var finished = function() {
        history.setEnd(currentFlowObjectName);
        if(history.isFinished()){
            self.views.duration = history.finishedAt - history.createdAt;
        }
        // NOTE: done() MUST be called AFTER setEnd() because in done() the token is send to the next flowObjects
        if (done) {
            done();
        }
    };

    if (self.onEndHandler) {
        self.onEndHandler.call(self.processClient, currentFlowObjectName, data, finished);
    } else {
        finished();
    }
};

/**
 * Called on end of processes (also called processes)
 * @param {String} endEventName
 * @param {Boolean=} isMainProcess
 * @param {Function=} done
 */
BPMNProcess.prototype.onProcessEnd = function(endEventName, isMainProcess, done) {
    var self = this;
    var history = self.getHistory();

    var finished = function() {
        if (done) {
            done();
        }
        if (isMainProcess) {
            self.views.endEvent = history.getLastEntry(endEventName);
            // no parent implies we finish the main process
            processCache.remove(self.processId);
            self.persist(true);
        }
    };

    if (self.isDebuggerEnabled()) {
        self._clearBPMNEditorState(finished);
    } else {
        finished();
    }
};

/**
 * @param {BPMNProcess} calledProcess
 */
BPMNProcess.prototype.registerCalledProcess = function(calledProcess) {
    var calledProcessId = calledProcess.processId;
    this.calledProcesses[calledProcessId] = calledProcess;
};

/**
 * @param {String} calledProcessId
 */
BPMNProcess.prototype.unregisterCalledProcess = function(calledProcessId) {
    delete this.calledProcesses[calledProcessId];
};

/**
 * @param {BPMNActivity} currentActivity
 * @private
 */
BPMNProcess.prototype._registerBoundaryTimerEvents = function(currentActivity) {
    var self = this;
    var boundaryEvents = this.processDefinition.getBoundaryEventsAt(currentActivity);

    boundaryEvents.forEach(function(boundaryEvent) {
        if (boundaryEvent.isTimerEvent) {
            self.pendingTimerEvents.addBoundaryTimerEvent(boundaryEvent);
        }
    });
};

/**
 * @param {BPMNIntermediateCatchEvent} timerEvent
 * @private
 */
BPMNProcess.prototype._registerIntermediateTimerEvents = function(timerEvent) {
    this.pendingTimerEvents.addIntermediateTimerEvent(timerEvent);
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @private
 */
BPMNProcess.prototype._clearBoundaryTimerEvents = function(currentFlowObject) {
    var self = this;
    var boundaryEvents = this.processDefinition.getBoundaryEventsAt(currentFlowObject);

    boundaryEvents.forEach(function(boundaryEvent) {
        if (boundaryEvent.isTimerEvent) {
            self.pendingTimerEvents.removeTimeout(boundaryEvent.name);
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerActivityEndEvents = function() {
    var self = this;

    self.on(ACTIVITY_END_EVENT, function(activityName, data) {
        var currentToken, owningProcessId, currentProcess, currentFlowObject, activityEndHandlerIsDone;
        var handlerName = handler.mapName2HandlerName(activityName) + activityEndHandlerPostfix;
        var trx = self.currentTrx = null;

        if(self.transactionLogger){
            trx = self.currentTrx = self.transactionLogger.startTransaction(self.processDefinition.name, 'PSTATE', 'TRANSITION', null, activityName+'Done');
        }

        if (self.state.hasTokens(activityName)) {
            currentToken = self.state.getFirstToken(activityName);
            owningProcessId = currentToken.owningProcessId;
            currentProcess = owningProcessId === self.processId ? self : self.calledProcesses[owningProcessId];
            currentFlowObject = currentProcess.processDefinition.getFlowObjectByName(currentToken.position);
            activityEndHandlerIsDone = function(data) {
                if(trx) {
                    trx.processStateEnd(self.processDefinition.name, self.getProcessId(), activityName);
                    trx.end();
                }
                self.logger.trace("Calling done() of '" + handlerName + "'.");
                currentProcess._emitTokens(currentFlowObject, data, true);
            };
            self.logger.trace("Calling '" + handlerName + "' for " + ACTIVITY_END_EVENT + " '" + activityName + "'.");
            handler.callHandler(handlerName, currentProcess, data, activityEndHandlerIsDone);
        } else {
            self.callDefaultEventHandler(ACTIVITY_END_EVENT, activityName, handlerName,
                "Process cannot handle this activity because it is not currently executed.",
                function(){
                    if(trx){
                        trx.end();
                    }
                });
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerThrowIntermediateEvents = function() {
    var self = this;

    self.on(INTERMEDIATE_CATCH_EVENT, function(eventName, data) {
        var catchIntermediateEventObject, eventCaughtHandler;
        var handlerName = handler.mapName2HandlerName(eventName);
        var trx = self.currentTrx = null;

        if(self.transactionLogger){
            trx = self.currentTrx = self.transactionLogger.startTransaction(self.processDefinition.name, 'PSTATE', 'TRANSITION', null, eventName);
        }

        if (self.state.hasTokens(eventName)) {
            if(trx) {
                trx.processEvent(self.processDefinition.name, self.getProcessId(), eventName);
            }
            catchIntermediateEventObject = self.processDefinition.getFlowObjectByName(eventName);
            eventCaughtHandler = function(data) {
                if(trx){
                    trx.end();
                }
                self.logger.trace("Calling done() of '" + handlerName + "'.");
                self._emitTokens(catchIntermediateEventObject, data, true);
            };
            self.logger.trace("Calling '" + handlerName + "' for " + INTERMEDIATE_CATCH_EVENT + " '" + eventName + "'.");
            handler.callHandler(handlerName, self, data, eventCaughtHandler);
        } else {
            self.callDefaultEventHandler(INTERMEDIATE_CATCH_EVENT, eventName, handlerName, "Process cannot handle the intermediate event ' + " +
                eventName + "' because the process '" + self.processDefinition.name + "' doesn't expect one.",
                function(){
                    if(trx){
                        trx.end();
                    }
                });
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerThrowBoundaryEvents = function() {
    var self = this;

    self.on(BOUNDARY_CATCH_EVENT, function(eventName, data) {
        var handlerName = handler.mapName2HandlerName(eventName);
        var catchBoundaryEventObject = self.processDefinition.getFlowObjectByName(eventName);
        var activity = self.processDefinition.getFlowObject(catchBoundaryEventObject.attachedToRef);
        var trx = self.currentTrx = null;

        if(self.transactionLogger){
            trx = self.currentTrx = self.transactionLogger.startTransaction(self.processDefinition.name, 'PSTATE', 'TRANSITION', null, eventName);
        }

        self.logger.trace("Catching boundary event '" + eventName + "' done.", data);

        if (self.state.hasTokensAt(activity)) {
            if(trx) {
                trx.processStateEnd(self.processDefinition.name, self.getProcessId(), activity.name);
            }
            self.state.removeTokenAt(activity);
            self._putTokenAt(catchBoundaryEventObject, data);
        } else {
            self.callDefaultEventHandler(BOUNDARY_CATCH_EVENT, eventName, handlerName, "Process cannot handle the boundary event '" +
                eventName + "' because the activity '" + activity.name + "' doesn't expect one.",
                function(){
                    if(trx) {
                        trx.end();
                    }
                });
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerOnTokenArrivedEvent = function() {
    var self = this;

    self.onTokenArrivedEvent(function(currentFlowObjectName, data) {
        var handlerDone;
        var currentFlowObject = self.processDefinition.getFlowObjectByName(currentFlowObjectName);
        var trx = self.currentTrx;

        self.logger.debug("Token arrived at " + currentFlowObject.type + " '" + currentFlowObject.name + "'", data);
        if (currentFlowObject.isIntermediateCatchEvent) {
            // all intermediate event handlers are called WHEN the event occurs
            // TODO: should we change this?
            if (currentFlowObject.isTimerEvent) {
                self._registerIntermediateTimerEvents(currentFlowObject);
            }
            self.persist();
        } else {
            handlerDone = function(data) {
                if (currentFlowObject.isWaitTask) {
                    if(trx){
                        trx.end();
                    }
                    self._registerBoundaryTimerEvents(currentFlowObject);
                    self.persist();
                } else if (currentFlowObject.isCallActivity || currentFlowObject.isSubProcess) {
                    if(trx){
                        trx.end();
                    }
                    self._registerBoundaryTimerEvents(currentFlowObject);
                    self._emitTokens(currentFlowObject, data);
                } else if(currentFlowObject.isActivity) {
                    if(trx) {
                        trx.processStateEnd(self.processDefinition.name, self.getProcessId(), currentFlowObjectName);
                        trx.end();
                    }
                    self._emitTokens(currentFlowObject, data);
                } else if (currentFlowObject.isExclusiveGateway) {
                    self._emitTokens(currentFlowObject, data);
                } else {
                    if(trx){
                        trx.end();
                    }
                    self._emitTokens(currentFlowObject, data);
                }
            };

            if(currentFlowObject.isBoundaryEvent && trx){
                if(trx) {
                    trx.processEvent(self.processDefinition.name, self.getProcessId(), currentFlowObjectName);
                }
            }else{
                if(self.transactionLogger) {
                    trx = self.currentTrx = self.transactionLogger.startTransaction(self.processDefinition.name, 'PSTATE', 'TRANSITION', null, currentFlowObjectName);

                    if (currentFlowObject.isActivity) {
                        trx.processStateStart(self.processDefinition.name, self.getProcessId(), currentFlowObjectName);
                    } else if (currentFlowObject.isIntermediateThrowEvent) {
                        trx.processEvent(self.processDefinition.name, self.getProcessId(), currentFlowObjectName);
                    } else if (currentFlowObject.isStartEvent) {
                        trx.processStart(self.processDefinition.name, self.getProcessId(), currentFlowObjectName);
                    } else if (currentFlowObject.isEndEvent) {
                        trx.processEnd(self.processDefinition.name, self.getProcessId(), currentFlowObjectName);
                    }
                }
            }

            handler.callHandler(currentFlowObjectName, self, data, handlerDone);
        }
     });
};

/**
 * @param {String} eventType
 * @param {String} eventName
 * @param data
 * @private
 */
BPMNProcess.prototype._emitEvent = function(eventType, eventName, data) {
    data = data || {};
    if (this.hasToDeferEvents()) {
        this.deferredEvents.push({type: eventType, name: eventName, data: data});
    } else {
        this.emit(eventType, eventName, data);
    }
};

/**
 * @private
 */
BPMNProcess.prototype._emitDeferredEvents = function() {
    var self = this;

    this.setDeferEvents(false); // we have to reset this flag, otherwise the deferred events we try to emit now would be deferred again!
    this.deferredEvents.forEach(function(event) {
        self.logger.trace("Emitting deferred events " + event.type + " '" + event.name + "'", event.data);
        self.emit(event.type, event.name, event.data);
    });
    this.deferredEvents = [];
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {String} reason
 * @param {Function=} done
 */
BPMNProcess.prototype.callDefaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason, done) {
    this.logger.trace("Unhandled event: '" + eventType + "' for '" + currentFlowObjectName + "'. Handler: " + handlerName + "'. Reason: " + reason);
    this.defaultEventHandler.call(this.processClient, eventType, currentFlowObjectName, handlerName, reason, done);
};

/**
 * @param {{toString, stack}} error
 */
function logDefaultedErrors(error) {
    console.log("Unhandled error: '" + error + "' Stack trace: " + error.stack);
}

