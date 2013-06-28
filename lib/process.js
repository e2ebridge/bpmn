/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

var util = require('util');
var bpmnDefinitionsModule = require('./parsing/definitions.js');
var activityModule = require('./parsing/activity.js');
var handlerModule = require('./handler.js');
var processCacheModule = require('./processCache.js');
var loggerModule = require('./logger.js');

var EventEmitter = require('events').EventEmitter;
var BPMNProcessState = require("./state.js").BPMNProcessState;
var BPMNProcessHistory = require("./history.js").BPMNProcessHistory;
var BPMNProcessClient = require("./client.js").BPMNProcessClient;
var BPMNPendingTimerEvents = require("./timeouts.js").BPMNPendingTimerEvents;

var TOKEN_ARRIVED_EVENT = "TOKEN_ARRIVED_EVENT";
var ACTIVITY_END_EVENT = "ACTIVITY_END_EVENT";
var INTERMEDIATE_CATCH_EVENT = "INTERMEDIATE_CATCH_EVENT";
var BOUNDARY_CATCH_EVENT = "BOUNDARY_CATCH_EVENT";

exports.clearCache = processCacheModule.clear;
exports.getById = processCacheModule.get;
exports.findByProperty = processCacheModule.findByProperty;
exports.findByState = processCacheModule.findByState;
exports.findByName = processCacheModule.findByName;

/**
 * Internal creation or get method. If the process has been already created it will just be fetched from the cache
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @return {BPMNProcess}
 */
function createOrGetBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken) {
    var bpmnProcess = processCacheModule.get(id);
    if (!bpmnProcess) {
        bpmnProcess = createBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken);
        processCacheModule.set(bpmnProcess.processId, bpmnProcess);
    }
    return bpmnProcess;
}
exports.createOrGetBPMNProcess = createOrGetBPMNProcess;

exports.createBPMNProcess4Testing = function createBPMNProcess4Testing(id, processDefinition, eventHandler, persistency, parentProcess, parentToken) {
    // We have to delete the cache otherwise we might take an old version of this process$
    // which might lead to very confusing situations while testing similar processes.
    processCacheModule.clear();
    return createOrGetBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken);
};

/**
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @param {HistoryEntry=} parentHistoryEntry
 * @return {BPMNProcess}
 */
function createBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistoryEntry) {
    var bpmnProcess = new BPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistoryEntry);
    if (bpmnProcess.isMainProcess()) {
        // we save all process information - including called processes - in one document
        bpmnProcess.loadPersistedData();
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
    this.data = {}; // TODO: how do we handle parent data?
    this.calledProcesses = {};
    this.logger = new loggerModule.Logger(this, {logLevel: loggerModule.logLevels.error});

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

    var self = this;
    var defaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason, done) {
        if (done) {
            done.call(self.processClient);
        }
    };
    var defaultErrorHandler = logDefaultedErrors;

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
 * @param {LogLevels | number | string} logLevel
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
 * @param {String} eventName
 * @param {Object=} data
 */
BPMNProcess.prototype.triggerEvent = function(eventName, data) {
    var self = this;
    var processDefinition = self.processDefinition;
    var flowObject = processDefinition.getFlowObjectByName(eventName);
    if (flowObject) {

        this.logger.trace("Trigger " + flowObject.type + " '" + flowObject.name + "'", data);

        if (flowObject.isStartEvent) {
            if (self.history.hasBeenVisited(eventName)) {
                 throw new Error("The start event '" + eventName + "' cannot start an already started process.");
            } else {
                // start events create a token and put it on the first occurrence
                self._putTokenAt(flowObject.name, data);
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

    if (typeof messageFlow === 'string') {
        this.triggerEvent(messageFlow, data);
    } else {
        if (messageFlow.targetProcessDefinitionId) {
            var partnerProcess = this.getParticipantById(messageFlow.targetProcessDefinitionId);
            var targetFlowObject = partnerProcess.processDefinition.getFlowObject(messageFlow.targetRef);
            var sourceFlowObject = this.processDefinition.getSourceFlowObject(messageFlow);

            this.logger.trace("Sending '" + messageFlow.name + "' from '" + sourceFlowObject.name + "' to '" + targetFlowObject.name + "'.", data);

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
BPMNProcess.prototype.getParticipantByName = function(participantName) {
    var participatingProcessId = this.participantIds[participantName];
    var participant = this.processDefinition.getParticipantByName(participantName);
    var participatingProcessDefinition = bpmnDefinitionsModule.getBPMNProcessDefinitions(participant.bpmnFileName);

    return createOrGetBPMNProcess(participatingProcessId, participatingProcessDefinition, this.eventHandler, this.persistency);
};

/**
 * @param {String} processDefinitionId
 * @return {BPMNProcess}
 */
BPMNProcess.prototype.getParticipantById = function(processDefinitionId) {
    var participant = this.processDefinition.getParticipantById(processDefinitionId);
    var participatingProcessId = this.participantIds[participant.name];
    var participatingProcessDefinition = bpmnDefinitionsModule.getBPMNProcessDefinitions(participant.bpmnFileName);

    return createOrGetBPMNProcess(participatingProcessId, participatingProcessDefinition, this.eventHandler, this.persistency);
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
 * @param {String} currentFlowObjectName
 * @param {Object=} data
 */
BPMNProcess.prototype._putTokenAt = function(currentFlowObjectName, data) {
    var self = this;
    self.state.createTokenAt(currentFlowObjectName, self.processId);
    self.logger.debug("Token was put on '" + currentFlowObjectName + "'", data);
    self.onFlowObjectBegin(currentFlowObjectName, data, function() {
        self._emitEvent(TOKEN_ARRIVED_EVENT, currentFlowObjectName, data);
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
    return this.data;
};

/**
 * @param {Boolean=} closeConnection
 */
BPMNProcess.prototype.persist = function(closeConnection) {
    var persistency = this.persistency;
    if (persistency) {
        this.setDeferEvents(true);
        var mainProcess = this.getMainProcess();
        var doneSaving = function(error, savedData) {
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

        var persistentData = {
            processName: mainProcess.processDefinition.name,
            processId: mainProcess.processId,
            parentToken: mainProcess.parentToken || null,
            data: mainProcess.data,
            state: mainProcess.state,
            history: mainProcess.history,
            pendingTimeouts: mainProcess.pendingTimerEvents.pendingTimeouts
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
BPMNProcess.prototype.loadPersistedData = function() {
    if (this.persistency) {
        this.setDeferEvents(true);
        var mainProcess = this.getMainProcess();
        var processId = mainProcess.processId;
        var processName = mainProcess.processDefinition.name;
        var doneLoading = function(error, loadedData) {

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
        };
        mainProcess.persistency.load(processId, processName, doneLoading);
    }
};

/**
 */
BPMNProcess.prototype.createCalledProcesses = function() {
    var self = this;
    var callActivityTokens = self.state.findCallActivityTokens();
    callActivityTokens.forEach(function(callActivityToken) {
        var callActivityName = callActivityToken.position;
        var callActivity = self.processDefinition.getFlowObjectByName(callActivityName);
        var calledProcess = callActivity.createCalledProcess(callActivityToken, self, createBPMNProcess);
        calledProcess.createCalledProcesses();
    });
};

BPMNProcess.prototype.setPersistedData = function(loadedData) {
    this.state = new BPMNProcessState(loadedData.state);
    this.history = new BPMNProcessHistory(loadedData.history);
    this.pendingTimerEvents = new BPMNPendingTimerEvents(this);
    this.pendingTimerEvents.restoreTimerEvents(loadedData.pendingTimeouts);
    this.data = loadedData.data || {};
};

/**
 * @param {String} name
 * @param {Object} value
 */
BPMNProcess.prototype.setProperty = function(name, value) {
    this.data[name] = value;
};

/**
 * @param {String} name
 * @return {Object}
 */
BPMNProcess.prototype.getProperty = function(name) {
    return this.data[name];
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object} data
 * @param {Boolean=} returningFromCalledProcess
 * @private
 */
BPMNProcess.prototype._emitTokens = function(currentFlowObject, data, returningFromCalledProcess) {
    var self = this;

    self.state.removeTokenAt(currentFlowObject);

    if (currentFlowObject.isBoundaryEvent) {
        var activity = self.processDefinition.getFlowObject(currentFlowObject.attachedToRef);
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
    this._putTokenAt(nextFlowObject.name, data);
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
 * @param {String} currentFlowObjectName
 * @param {Object} data
 * @param {Function} done
 * @private
 */
BPMNProcess.prototype.onFlowObjectBegin = function(currentFlowObjectName, data, done) {
    var self = this;

    self.history.addEntry(currentFlowObjectName);

    var finished = function() {
        if (self.onBeginHandler) {
            self.onBeginHandler.call(self.processClient, currentFlowObjectName, data, function() {
                done();
            });
        } else {
            done();
        }
    };

    if (self.isDebuggerEnabled()) {
        this._notifyBPMNEditor(currentFlowObjectName, finished);
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

    var finished = function() {
        self.history.setEnd(currentFlowObjectName);
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

    var finished = function() {
        if (done) {
            done();
        }
        if (isMainProcess) {
            // no parent implies we finish the main process
            processCacheModule.remove(self.processId);
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
        var handlerName = handlerModule.mapName2HandlerName(activityName) + activityModule.activityEndHandlerPostfix;
        if (self.state.hasTokens(activityName)) {
            var currentToken = self.state.getFirstToken(activityName);
            var owningProcessId = currentToken.owningProcessId;
            var currentProcess = owningProcessId === self.processId ? self : self.calledProcesses[owningProcessId];
            var currentFlowObject = currentProcess.processDefinition.getFlowObjectByName(currentToken.position);
            var activityEndHandlerIsDone = function(data) {
                self.logger.trace("Calling done() of '" + handlerName + "'.");
                currentProcess._emitTokens(currentFlowObject, data, true);
            };
            self.logger.trace("Calling '" + handlerName + "' for " + ACTIVITY_END_EVENT + " '" + activityName + "'.");
            handlerModule.callHandler(handlerName, currentProcess, data, activityEndHandlerIsDone);
        } else {
            self.callDefaultEventHandler(ACTIVITY_END_EVENT, activityName, handlerName, "Process cannot handle this activity because it is not currently executed.");
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerThrowIntermediateEvents = function() {
    var self = this;
    self.on(INTERMEDIATE_CATCH_EVENT, function(eventName, data) {
        var handlerName = handlerModule.mapName2HandlerName(eventName);
        if (self.state.hasTokens(eventName)) {
            var catchIntermediateEventObject = self.processDefinition.getFlowObjectByName(eventName);
            var eventCaughtHandler = function(data) {
                self.logger.trace("Calling done() of '" + handlerName + "'.");
                self._emitTokens(catchIntermediateEventObject, data, true);
            };
            self.logger.trace("Calling '" + handlerName + "' for " + INTERMEDIATE_CATCH_EVENT + " '" + eventName + "'.");
            handlerModule.callHandler(handlerName, self, data, eventCaughtHandler);
        } else {
            self.callDefaultEventHandler(INTERMEDIATE_CATCH_EVENT, eventName, handlerName, "Process cannot handle the intermediate event ' + " +
                eventName + "' because the process '" + self.processDefinition.name + "' doesn't expect one.");
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerThrowBoundaryEvents = function() {
    var self = this;
    self.on(BOUNDARY_CATCH_EVENT, function(eventName, data) {
        var handlerName = handlerModule.mapName2HandlerName(eventName);
        var catchBoundaryEventObject = self.processDefinition.getFlowObjectByName(eventName);
        var activity = self.processDefinition.getFlowObject(catchBoundaryEventObject.attachedToRef);

        self.logger.trace("Catching boundary event '" + eventName + "' done.", data);

        if (self.state.hasTokensAt(activity)) {
            self.state.removeTokenAt(activity);
            self._putTokenAt(catchBoundaryEventObject.name, data);
        } else {
            self.callDefaultEventHandler(BOUNDARY_CATCH_EVENT, eventName, handlerName, "Process cannot handle the boundary event '" +
                eventName + "' because the activity '" + activity.name + "' doesn't expect one.");
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerOnTokenArrivedEvent = function() {
    var self = this;
    self.onTokenArrivedEvent(function(currentFlowObjectName, data) {
        var currentFlowObject = self.processDefinition.getFlowObjectByName(currentFlowObjectName);
        self.logger.debug("Token arrived at " + currentFlowObject.type + " '" + currentFlowObject.name + "'", data);
        if (currentFlowObject.isIntermediateCatchEvent) {
            // all intermediate event handlers are called WHEN the event occurs
            // TODO: should we change this?
            if (currentFlowObject.isTimerEvent) {
                self._registerIntermediateTimerEvents(currentFlowObject);
            }
            self.persist();
        } else {
            var handlerDone = function(data) {
                if (currentFlowObject.isWaitTask) {
                    self._registerBoundaryTimerEvents(currentFlowObject);
                    self.persist();
                } else if (currentFlowObject.isCallActivity || currentFlowObject.isSubProcess) {
                    self._registerBoundaryTimerEvents(currentFlowObject);
                    self._emitTokens(currentFlowObject, data);
                } else {
                    self._emitTokens(currentFlowObject, data);
                }
            };
            handlerModule.callHandler(currentFlowObjectName, self, data, handlerDone);
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

