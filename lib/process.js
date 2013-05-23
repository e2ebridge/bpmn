/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var bpmnDefinitionsModule = require('./bpmn/definitions.js');
var activityModule = require('./bpmn/activity.js');
var handlerModule = require('./handler.js');

var EventEmitter = require('events').EventEmitter;
var Persistency = require('./persistency.js').Persistency;
var BPMNProcessState = require("./state.js").BPMNProcessState;
var BPMNProcessHistory = require("./history.js").BPMNProcessHistory;
var BPMNProcessClient = require("./client.js").BPMNProcessClient;
var BPMNPendingTimeouts = require("./timeouts.js").BPMNPendingTimeouts;

var tokenArrivedEvent = "tokenArrivedEvent";
var activityEndEvent = "activityEndEvent";
var throwIntermediateEvent = "throwIntermediateEvent";
var throwBoundaryEvent = "throwBoundaryEvent";

var processCache = {};
function clearCache() {
    processCache = {};
}
exports.clearCache = clearCache;

/**
 * @param {String} processId
 */
function removeFromCache(processId) {
    delete processCache[processId];
}

/**
 * @param {String} processId
 * @returns {BPMNProcess}
 */
function getFromCache(processId) {
    return processCache[processId];
}
exports.getFromCache = getFromCache;

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
    var bpmnProcess = processCache[id];
    if (!bpmnProcess) {
        bpmnProcess = createBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken);
        processCache[bpmnProcess.processId] = bpmnProcess;
    }
    return bpmnProcess;
}
exports.createOrGetBPMNProcess = createOrGetBPMNProcess;

exports.createBPMNProcess4Testing = function createBPMNProcess4Testing(id, processDefinition, eventHandler, persistency, parentProcess, parentToken) {
    // We have to delete the cache otherwise we might take an old version of this process$
    // which might lead to very confusing situations while testing similar processes.
    clearCache();
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
    var isMainProcess = parentProcess === undefined || parentProcess === null;
    if (isMainProcess) {
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
    this.pendingTimeouts = new BPMNPendingTimeouts(this);
    this.persistency = persistency;
    this.deferredEvents = [];
    this.deferEvents = false; // events must be deferred if the process engine is loading or saving state
    this.processClient = new BPMNProcessClient(this);
    this.participant2IdMap = {}; // if the process takes part in a collaboration, we store all participant process ids in this map
    this.data = {}; // TODO: how do we handle parent data?
    this.calledProcesses = {};

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
        handlerModule.logDefaultedEvents(eventType, currentFlowObjectName, handlerName, reason);
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

    this._registerOnTokenArrivedEvent();
    this._registerActivityEndEvents();
    this._registerThrowIntermediateEvents();
    this._registerThrowBoundaryEvents();
}
util.inherits(BPMNProcess, EventEmitter);

/**
 * @param {String} eventName
 * @param {Object=} data
 */
BPMNProcess.prototype.sendEvent = function(eventName, data) {
    var self = this;
    var processDefinition = self.processDefinition;
    var flowObject = processDefinition.getFlowObjectByName(eventName);
    if (flowObject) {
        if (flowObject.isStartEvent) {
            if (self.history.hasBeenVisited(eventName)) {
                 throw new Error("The start event '" + eventName + "' cannot start an already starting process.");
            } else {
                // start events create a token and put it on the first occurrence
                self._putTokenAt(flowObject.name, data);
            }
        } else if (flowObject.isIntermediateCatchEvent) {
            process.nextTick(function() {
                // We need this to achieve parallel collaborating processes
                self._emitEvent(throwIntermediateEvent, eventName, data);
            });
        } else if (flowObject.isBoundaryEvent) {
            self._emitEvent(throwBoundaryEvent, eventName, data);
        } else {
            throw new Error("The process '" + processDefinition.name + "' has no intermediate catch event for '" + eventName + "'");
        }
    } else {
        throw new Error("The process '" + processDefinition.name + "' does not know the event '" + eventName + "'");
    }
 };

/**
 * @param {BPMNMessageFlow} messageFlow
 * @param {Object=} data
 */
BPMNProcess.prototype.sendMessage = function(messageFlow, data) {
    var partnerProcess = this.getParticipantById(messageFlow.targetProcessDefinitionId);
    var targetFlowObject = partnerProcess.processDefinition.getFlowObject(messageFlow.targetRef);
    partnerProcess.sendEvent(targetFlowObject.name, data);
};

/**
 * @param {String} taskName
 * @param {Object} data
 */
BPMNProcess.prototype.taskDone = function(taskName, data) {
    this.emitActivityEndEvent(taskName, data);
};

/**
 * @param {String} participantName
 * @return {BPMNProcess}
 */
BPMNProcess.prototype.getParticipantByName = function(participantName) {
    var participatingProcessId = this.participant2IdMap[participantName];
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
    var participatingProcessId = this.participant2IdMap[participant.name];
    var participatingProcessDefinition = bpmnDefinitionsModule.getBPMNProcessDefinitions(participant.bpmnFileName);

    return createOrGetBPMNProcess(participatingProcessId, participatingProcessDefinition, this.eventHandler, this.persistency);
};

/**
 * @param {String} participantName
 * @param {String} processId
  */
BPMNProcess.prototype.addParticipantId = function(participantName, processId) {
    this.participant2IdMap[participantName] = processId;
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
    this.state.createTokenAt(currentFlowObjectName, this.processId);
    this.history.addEntry(currentFlowObjectName);
    this._emitEvent(tokenArrivedEvent, currentFlowObjectName, data);
};

/**
 * @param {Function} callback
 */
BPMNProcess.prototype.onTokenArrivedEvent = function(callback) {
    this.on(tokenArrivedEvent, callback);
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
 */
BPMNProcess.prototype.persist = function() {
    if (this.persistency) {
        this.setDeferEvents(true);
        var mainProcess = this.getMainProcess();
        var doneSaving = function(error, savedData) {
            if (mainProcess.doneSavingHandler) {
                mainProcess.doneSavingHandler.call(mainProcess.processClient, error, savedData);
            }
            mainProcess._emitDeferredEvents();
        };

        var persistentData = {
            processName: mainProcess.processDefinition.name,
            processId: mainProcess.processId,
            parentToken: mainProcess.parentToken || null,
            data: mainProcess.data,
            state: mainProcess.state,
            history: mainProcess.history,
            eventName2TimeoutMap: mainProcess.pendingTimeouts.eventName2TimeoutMap
        };
        this.persistency.persist(persistentData, doneSaving);
    }
};

/**
 * @returns {BPMNProcess}
 */
BPMNProcess.prototype.getMainProcess = function() {
    if (this.parentProcess) {
        return this.parentProcess.getMainProcess();
    } else {
        return this;
    }
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
        var doneLoading = function(error, loadedData) {
            if (loadedData) {
                mainProcess.setPersistedData(loadedData);
                mainProcess.createCalledProcesses();
            }

            var wasReadingData = error || loadedData;
            if (wasReadingData) {
                if (mainProcess.doneLoadingHandler) {
                    mainProcess.doneLoadingHandler.call(mainProcess.processClient, error, loadedData);
                }
            }

            mainProcess._emitDeferredEvents();
        };
        mainProcess.persistency.load(mainProcess.processId, doneLoading);
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
    this.pendingTimeouts = new BPMNPendingTimeouts(this);
    this.pendingTimeouts.addTimeouts(loadedData.eventName2TimeoutMap);
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
BPMNProcess.prototype._emitNextTokens = function(currentFlowObject, data, returningFromCalledProcess) {
    var self = this;

    self.state.removeTokenAt(currentFlowObject);

    if (currentFlowObject.isBoundaryEvent) {
        // We leave the activity via a boundary event. Thus:
        //  - The activity token has to be removed as well
        //  - Timeouts have to be cleared
        var activity = self.processDefinition.getFlowObject(currentFlowObject.attachedToRef);
        self._clearTimeouts(activity);
        this.state.removeTokenAt(activity);
    } else {
        self._clearTimeouts(currentFlowObject);
    }

    if (currentFlowObject.isCallActivity) {
        currentFlowObject.emitTokens(self, data, createBPMNProcess, returningFromCalledProcess);
    } else if (currentFlowObject.isEndEvent) {
        currentFlowObject.emitTokens(self, data, removeFromCache);
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
    this._emitEvent(activityEndEvent, eventName, data);
};

/**
 * @param {BPMNSequenceFlow} outgoingSequenceFlow
 * @param {Object} data
 */
BPMNProcess.prototype.emitTokenAlong = function(outgoingSequenceFlow, data) {
    var processDefinition = this.processDefinition;
    var nextFlowObject = processDefinition.getProcessElement(outgoingSequenceFlow.targetRef);
    this._putTokenAt(nextFlowObject.name, data);
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
    delete this.calledProcesses[calledProcessId];
};

/**
 * @param {BPMNActivity} currentActivity
 * @private
 */
BPMNProcess.prototype._registerTimeouts = function(currentActivity) {
    var self = this;
    var boundaryEvents = this.processDefinition.getBoundaryEventsAt(currentActivity);
    boundaryEvents.forEach(function(boundaryEvent) {
        if (boundaryEvent.isTimerEvent) {
            self.pendingTimeouts.addTimeout(boundaryEvent.name);
        }
    });
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @private
 */
BPMNProcess.prototype._clearTimeouts = function(currentFlowObject) {
    var self = this;

    var boundaryEvents = this.processDefinition.getBoundaryEventsAt(currentFlowObject);
    boundaryEvents.forEach(function(boundaryEvent) {
        if (boundaryEvent.isTimerEvent) {
            // when leaving the currentFlowObject we get rid of the active timeout
            self.pendingTimeouts.removeTimeout(boundaryEvent.name);
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerActivityEndEvents = function() {
    var self = this;
    self.on(activityEndEvent, function(activityName, data) {
        var handlerName = handlerModule.mapName2HandlerName(activityName) + activityModule.activityEndHandlerPostfix;
        if (self.state.hasTokens(activityName)) {
            var currentToken = self.state.getFirstToken(activityName);
            var owningProcessId = currentToken.owningProcessId;
            var currentProcess = owningProcessId === self.processId ? self : self.calledProcesses[owningProcessId];
            var currentFlowObject = currentProcess.processDefinition.getFlowObjectByName(currentToken.position);
            var activityEndHandlerIsDone = function(data) {
                currentProcess._emitNextTokens(currentFlowObject, data, true);
            };
            handlerModule.callHandler(handlerName, currentProcess, data, activityEndHandlerIsDone);
        } else {
            self.callDefaultEventHandler(activityEndEvent, activityName, handlerName, "Process cannot handle this activity because it is not currently executed.");
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerThrowIntermediateEvents = function() {
    var self = this;
    self.on(throwIntermediateEvent, function(eventName, data) {
        var handlerName = handlerModule.mapName2HandlerName(eventName);
        if (self.state.hasTokens(eventName)) {
            var catchIntermediateEventObject = self.processDefinition.getFlowObjectByName(eventName);
            var eventCaughtHandler = function(data) {
                self._emitNextTokens(catchIntermediateEventObject, data, true);
            };
            handlerModule.callHandler(handlerName, self, data, eventCaughtHandler);
        } else {
            self.callDefaultEventHandler(throwIntermediateEvent, eventName, handlerName, "Process cannot handle the intermediate event '"
                + eventName + "' because the process '" + self.processDefinition.name + "' doesn't expect one.");
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerThrowBoundaryEvents = function() {
    var self = this;
    self.on(throwBoundaryEvent, function( eventName, data) {
        var handlerName = handlerModule.mapName2HandlerName(eventName);
        var catchBoundaryEventObject = self.processDefinition.getFlowObjectByName(eventName);
        var activity = self.processDefinition.getFlowObject(catchBoundaryEventObject.attachedToRef);
        if (self.state.hasTokensAt(activity)) {
            self.state.removeTokenAt(activity);
            self._putTokenAt(catchBoundaryEventObject.name, data);
        } else {
            self.callDefaultEventHandler(throwBoundaryEvent, eventName, handlerName, "Process cannot handle the boundary event '"
                + eventName + "' because the activity '" + activity.name + "' doesn't expect one.");
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
        if (currentFlowObject.isIntermediateCatchEvent) {
             self.persist();
        } else {
            // call the handler
            var handlerDone = function(data) {
                if (currentFlowObject.isWaitTask) {
                    self._registerTimeouts(currentFlowObject);
                    self.persist();
                } else if (currentFlowObject.isCallActivity) {
                    self._registerTimeouts(currentFlowObject);
                    self._emitNextTokens(currentFlowObject, data);
                } else {
                    self._emitNextTokens(currentFlowObject, data);
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
    this.defaultEventHandler.call(this.processClient, eventType, currentFlowObjectName, handlerName, reason, done);
};

/**
 * @param {{toString, stack}} error
 */
function logDefaultedErrors(error) {
    console.log("Unhandled error: '" + error + "' Stack trace: " + error.stack);
}



