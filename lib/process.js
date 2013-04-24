/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var bpmnProcessDefinitionModule = require('./bpmn/processDefinition.js');
var handlerModule = require('./handler.js');

var EventEmitter = require('events').EventEmitter;
var Persistency = require('./persistency.js').Persistency;
var BPMNProcessState = require("./state.js").BPMNProcessState;
var BPMNProcessHistory = require("./history.js").BPMNProcessHistory;
var BPMNProcessClient = require("./public.js").BPMNProcessClient;

var tokenArrivedEvent = "tokenArrivedEvent";
var activityFinishedEvent = "activityFinishedEvent";

var activityFinishedHandlerPostfix = "Done";
var getTimeoutHandlerPostfix = handlerModule.handlerNameSeparator + "getTimeout";

var activeProcessesCache = {};
function clearActiveProcessesCache() {
    activeProcessesCache = {};
}
exports.clearActiveProcessesCache = clearActiveProcessesCache;
exports.getActiveProcessesCache = function() {
    return activeProcessesCache;
};



/**
 * Internal creation or get method. If the process has been already created it will just be fetched from the cache
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @param {Array=} parentHistory
 * @return {BPMNProcess}
 */
function createOrGetBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistory) {
    var bpmnProcess = activeProcessesCache[id];
    if (!bpmnProcess) {
        bpmnProcess = new BPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistory);
        bpmnProcess.loadState();
        activeProcessesCache[bpmnProcess.processId] = bpmnProcess;
    }
    return bpmnProcess;
}
exports.createOrGetBPMNProcess = createOrGetBPMNProcess;

exports.createBPMNProcess4Testing = function createBPMNProcess4Testing(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistory) {
    // We have to delete the cache otherwise we might take an old version of this process$
    // which might lead to very confusing situations while testing similar processes.
    clearActiveProcessesCache();
    return createOrGetBPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistory);
};

/**
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @param {BPMNProcessHistory=} parentHistory
 * @constructor
 */
function BPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistory) {
    this.processDefinition = processDefinition;
    this.eventHandler = eventHandler;
    this.parentToken = parentToken;
    this.parentProcess = parentProcess;
    this.state = new BPMNProcessState();
    this.data = {};
    this.history = parentHistory || new BPMNProcessHistory();
    this.persistency = persistency;
    this.processId = id;
    this.deferredEvents = [];
    this.activeTimers = {};
    this.deferEvents = false; // events must be deferred if the process engine is loading or saving state
    this.processClient = new BPMNProcessClient(this);

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
    this._registerActivityFinishedEvent();
}
exports.BPMNProcess = BPMNProcess;

util.inherits(BPMNProcess, EventEmitter);

/**
 * @param {String} eventName
 * @param {Object} data
 */
BPMNProcess.prototype.sendStartEvent = function(eventName, data) {
    var flowObject = this.processDefinition.getFlowObjectByName(eventName);
    if (flowObject.isStartEvent) {
        this._putTokenAt(flowObject, data);
    } else {
        throw new Error("The event '" + eventName + "' is not a start event.");
    }
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
    this.state.createTokenAt(currentFlowObject.name, this.processId);
    this.history.addEntry(currentFlowObject.name);
    this._emitEvent(tokenArrivedEvent, currentFlowObject.name, data);
};

/**
 * @param {String} taskName
 * @param {Object} data
 */
BPMNProcess.prototype.taskDone = function(taskName, data) {
    this._emitEvent(activityFinishedEvent, taskName, data);
};

/**
 * @param {Function(taskName, data)} callback
 */
BPMNProcess.prototype.onActivityFinished = function(callback) {
    this.on(activityFinishedEvent, callback);
};

/**
 * @param {Function(eventName, data)} callback
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
        this.deferEvents = true;
        var self = this;
        var doneSaving = function(error, savedData) {
            self._emitDeferredEvents();
            if (self.doneSavingHandler) {
                self.doneSavingHandler.call(self.processClient, error, savedData);
            }
        };
        var persistentData = collectPersistentData(this);
        this.persistency.persist(persistentData, doneSaving);
    }
};

/**
 * @param {BPMNProcess} currentProcess
 * @param {Object=} container
 * @return {Object}
 */
function collectPersistentData(currentProcess, container) {
    container = container || {};
    container.processId = currentProcess.processId;
    container.data = currentProcess.data;
    container.state = currentProcess.state;
    container.history = currentProcess.history;

    var parentProcess = currentProcess.parentProcess;
    var parentToken = currentProcess.parentToken;
    if (parentProcess && parentToken) {
        var newContainer = {};
        // we collect bottom up, so we have always just one active subprocess
        newContainer.activeSubprocess = container;
        newContainer.activeSubprocessParentToken = parentToken;
        return collectPersistentData(parentProcess, newContainer);
    } else {
        return container;
    }
}

/**
 */
BPMNProcess.prototype.loadState = function() {
    if (this.persistency) {
        this.deferEvents = true;
        var self = this;
        var doneLoading = function(error, loadedData) {
            if (error) {
                throw error;
            } else {
                if (loadedData) {
                    loadState(self, loadedData);
                }
            }
            if (error || loadedData) {
                if (self.doneLoadingHandler) {
                    self.doneLoadingHandler.call(self.processClient, error, loadedData);
                }
            }
            // MUST be AFTER the external handler because
            // we DEFINE the behaviour that after loading
            // no deferred events have been emitted
            self._emitDeferredEvents();
        };
        this.persistency.load(this.processId, doneLoading);
    }
};

function loadState(currentProcess, loadedData) {
    var state = new BPMNProcessState(loadedData.state);
    var history = new BPMNProcessHistory(loadedData.history);

    currentProcess.data = loadedData.data || {};
    currentProcess.state = state;
    currentProcess.history = history;

    var subprocessData = loadedData.activeSubprocess;
    var subprocessParentToken = loadedData.activeSubprocessParentToken;
    if (subprocessData && subprocessParentToken) {

        var subprocessId = subprocessData.processId;
        var callActivityName = subprocessParentToken.position;
        var callActivityHistoryEntry = history.getLastEntry(callActivityName);
        var callActivity = currentProcess.processDefinition.getFlowObjectByName(callActivityName);
        var subprocessHistory = callActivityHistoryEntry.subprocessHistory;
        var bpmnFilePath = callActivity.location;
        var processDefinition = bpmnProcessDefinitionModule.getBPMNProcessDefinition(bpmnFilePath);

        var subprocess = new BPMNProcess(subprocessId,
            processDefinition,
            currentProcess.eventHandler,
            currentProcess.persistency,
            currentProcess,
            subprocessParentToken,
            subprocessHistory);

        activeProcessesCache[subprocessId] = subprocess;

        loadState(subprocess, subprocessData);
    }
}
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
 * @param {Boolean=} returningFromSubprocess
 * @private
 */
BPMNProcess.prototype._emitNextTokens = function(currentFlowObject, data, returningFromSubprocess) {
    var self = this;

    self.state.removeTokenAt(currentFlowObject);
    self._unregisterBoundaryEvents(currentFlowObject);

    if (currentFlowObject.isBoundaryEvent) {
        // we leave the activity via a boundary event. The activity token has to be removed as well
        var activity = self.processDefinition.getFlowObject(currentFlowObject.attachedToRef);
        this.state.removeTokenAt(activity);
    }

    if (currentFlowObject.isCallActivity) {
        currentFlowObject.emitTokens(self, data, createOrGetBPMNProcess, returningFromSubprocess);
    } else {
        currentFlowObject.emitTokens(self, data);
    }
};

/**
 * @param {String} eventName
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype.emitActivityFinishedEvent = function(eventName, data) {
    this._emitEvent(activityFinishedEvent, eventName, data);
};

/**
 * @param {BPMNSequenceFlow} outgoingSequenceFlow
 * @param {Object} data
 */
BPMNProcess.prototype.emitTokenAlong = function(outgoingSequenceFlow, data) {
    var processDefinition = this.processDefinition;
    var nextFlowObject = processDefinition.getProcessElement(outgoingSequenceFlow.targetRef);
    this._putTokenAt(nextFlowObject, data);
};

/**
 * @param {BPMNActivity} currentActivity
 * @private
 */
BPMNProcess.prototype._registerBoundaryEvents = function(currentActivity) {
    var self = this;
    var boundaryEvents = this.processDefinition.getBoundaryEventsAt(currentActivity);
    boundaryEvents.forEach(function(boundaryEvent) {
        if (boundaryEvent.isTimerEvent) {
            self._setTimerOn(boundaryEvent);
        } else {
            // TODO
        }
    });
};

/**
 * @param {BPMNBoundaryEvent} timerBoundaryEvent
 * @private
 */
BPMNProcess.prototype._setTimerOn = function(timerBoundaryEvent) {
    var self = this;

    var timer;
    var timeoutHappened = function() {
        self._putTokenAt(timerBoundaryEvent);
    };

    var timerEventName = timerBoundaryEvent.name;
    var getTimeoutHandlerName = timerEventName + getTimeoutHandlerPostfix;
    var timeout = handlerModule.callHandler(getTimeoutHandlerName, self);
    if (isNaN(timeout)) {
        throw Error("The getTimeout handler '" + getTimeoutHandlerName +
            "' does not return a number but '" + timeout + "'");
    } else {
        timer = setTimeout(timeoutHappened, Math.floor(timeout));
        self.activeTimers[timerEventName] = timer;
    }
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @private
 */
BPMNProcess.prototype._unregisterBoundaryEvents = function(currentFlowObject) {
    var self = this;
    var activity;

    if (currentFlowObject.isBoundaryEvent) {
        // we leave the activity via a boundary event
        activity = self.processDefinition.getFlowObject(currentFlowObject.attachedToRef);
    } else {
        activity = currentFlowObject;
    }

    var boundaryEvents = this.processDefinition.getBoundaryEventsAt(activity);
    boundaryEvents.forEach(function(boundaryEvent) {
        if (boundaryEvent.isTimerEvent) {
            var timerEvenName = boundaryEvent.name;
            var timer = self.activeTimers[timerEvenName];
            if (timer) {
                clearTimeout(timer);
                delete self.activeTimers[timerEvenName];
            }
        } else {
            // TODO
        }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerActivityFinishedEvent = function() {
    var self = this;
    self.onActivityFinished(function(activityName, data) {
        var handlerName = activityName + activityFinishedHandlerPostfix;
        var tokensAtActivity = self.state.findTokens(activityName);
        var numberOfTokensAtActivity = tokensAtActivity.length;
        if (numberOfTokensAtActivity) {
            // TODO: how to handle more than one token?
            var currentToken = tokensAtActivity[0];
            var currentProcess = activeProcessesCache[currentToken.owningProcessId];
            var currentFlowObject = currentProcess.processDefinition.getFlowObjectByName(currentToken.position);
            var outgoingFlows = currentProcess.processDefinition.getOutgoingSequenceFlows(currentFlowObject);
            var hasOutgoingFlows = outgoingFlows.length > 0;
            if (hasOutgoingFlows) {
                var activityFinishedHandlerIsDone = function(data) {
                    currentProcess._emitNextTokens(currentFlowObject, data, true);
                };
                handlerModule.callHandler(handlerName, currentProcess, data, activityFinishedHandlerIsDone);
            } else {
                self.callDefaultEventHandler(activityFinishedEvent, activityName, handlerName, "Found no outgoing flow.");
            }
        } else {
            self.callDefaultEventHandler(activityFinishedEvent, activityName, handlerName, "Process cannot handle this activity because it is not currently executed.");
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
        var handlerDone = function(data) {
            if (currentFlowObject.isWaitActivity) {
                self.persist();
                self._registerBoundaryEvents(currentFlowObject);
            } else {
                self._emitNextTokens(currentFlowObject, data);
            }
        };
        handlerModule.callHandler(currentFlowObjectName, self, data, handlerDone);
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
    if (this.deferEvents) {
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
    this.deferEvents = false; // we have to reset this flag, otherwise the deferred events we try to emit now would be deferred again!
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



