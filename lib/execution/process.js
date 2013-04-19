/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var fileUtilsModule = require('../utils/file.js');
var bpmnProcessDefinitionModule = require('../bpmn/processDefinition.js');

var EventEmitter = require('events').EventEmitter;
var Persistency = require('./persistency.js').Persistency;
var BPMNProcessState = require("./processState.js").BPMNProcessState;
var BPMNProcessClient = require("./processClient.js").BPMNProcessClient;

var tokenArrivedEvent = "tokenArrivedEvent";
var activityFinishedEvent = "activityFinishedEvent";

var activityFinishedHandlerPostfix = "Done";
var getTimeoutHandlerPostfix = ":getTimeout";

var activeProcessesCache = {};
exports.clearActiveProcessesCache = function() {
    activeProcessesCache = {};
};
exports.getActiveProcessesCache = function() {
    return activeProcessesCache;
};

/**
 * A BPMN process having a given processId is created and it's state is loaded if it has been persisted
 * @param {String} processId
 * @param {String} bpmnFilePath Full qualified file nanme of the bpmn file to be loaded
 * @param {String=} persistencyPath
 * @param {Function=} doneLoading Called after state has been loaded and BEFORE deferred events are emitted. This callback makes only sense if we have a persistencyPath
 * @param {Function=} doneSaving Called after state has been aved and BEFORE deferred events are emitted. This callback makes only sense if we have a persistencyPath
 * @return {BPMNProcessClient}
 */
exports.getBPMNProcess = function(processId, bpmnFilePath, persistencyPath, doneLoading, doneSaving) {

    var persistency = persistencyPath ? new Persistency({path: persistencyPath}) : null;
    var processDefinition = bpmnProcessDefinitionModule.getBPMNProcessDefinition(bpmnFilePath);
    var handler = getHandlerFromFile(bpmnFilePath);
    handler.doneLoadingHandler = handler.doneLoadingHandler || doneLoading;
    handler.doneSavingHandler = handler.doneSavingHandler || doneSaving;

    var bpmnProcess = createBPMNProcess(processId, processDefinition, handler, persistency);

    return bpmnProcess.processClient;
};

/**
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @param {Array=} parentHistory
 * @constructor
 */
exports.createBPMNProcess = createBPMNProcess = function(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistory) {
    var bpmnProcess = activeProcessesCache[id];
    if (!bpmnProcess) {
        bpmnProcess = new BPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistory);
        bpmnProcess.loadState();
        activeProcessesCache[bpmnProcess.processId] = bpmnProcess;
    }
    return bpmnProcess;
};


/**
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @param {BPMNProcess=} parentProcess
 * @param {Token=} parentToken
 * @param {Array=} parentHistory
 * @constructor
 */
function BPMNProcess(id, processDefinition, eventHandler, persistency, parentProcess, parentToken, parentHistory) {
    this.processDefinition = processDefinition;
    this.eventHandler = eventHandler;
    this.parentToken = parentToken;
    this.parentProcess = parentProcess;
    this.state = new BPMNProcessState();
    this.data = {};
    this.history = parentHistory || [];
    this.persistency = persistency;
    this.processId = id;
    this.deferredEvents = [];
    this.activeTimers = {};
    this.deferEvents = false; // events must be deferred if the process engine is loading or saving state
    this.processClient = new BPMNProcessClient(this);

    var self = this;
    var defaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason, done) {
        logDefaultedEvents(eventType, currentFlowObjectName, handlerName, reason);
        if (done) {
            done.call(self.processClient);
        }
    };
    var defaultErrorHandler = logDefaultedErrors;

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
    this.history.push(currentFlowObject.name);
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
 * @return {Array.<String>}
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
    currentProcess.data = loadedData.data || {};
    currentProcess.state = state;
    currentProcess.history = loadedData.history || [];

    var subprocessData = loadedData.activeSubprocess;
    var subprocessParentToken = loadedData.activeSubprocessParentToken;
    if (subprocessData && subprocessParentToken) {

        var subprocessId = subprocessData.processId;
        var callActivityName = subprocessParentToken.position;
        var callActivity = currentProcess.processDefinition.getFlowObjectByName(callActivityName);
        var bpmnFilePath = callActivity.location;
        var processDefinition = bpmnProcessDefinitionModule.getBPMNProcessDefinition(bpmnFilePath);
        var subprocessHistory = []; // TODO

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

    if (currentFlowObject.isExclusiveGateway) {
        self._emitTokenAtExclusiveGateway(currentFlowObject, data);
    } else if (currentFlowObject.isParallelGateway) {
        self._emitTokensAtParallelGateway(currentFlowObject, data);
    } else if (currentFlowObject.isCallActivity) {
        self._emitTokensAtCallActivity(currentFlowObject, data, returningFromSubprocess);
    } else if (currentFlowObject.isEndEvent) {
        self._emitTokensAtEndEvent(currentFlowObject, data);
    } else {
        self._emitTokensAt(currentFlowObject, data);
    }
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokensAt = function(currentFlowObject, data) {
    var self = this;
    var outgoingSequenceFlows = self.processDefinition.getOutgoingSequenceFlows(currentFlowObject);
    outgoingSequenceFlows.forEach(function(outgoingSequenceFlow) {
        self._emitTokenAlong(outgoingSequenceFlow, data);
    });
};

/**
 * @param {BPMNFlowObject} currentGateway
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokenAtExclusiveGateway = function(currentGateway, data) {
    var self = this;
    var emittedToken = false;
    var outgoingSequenceFlows = this.processDefinition.getOutgoingSequenceFlows(currentGateway);
    var isDiverging = outgoingSequenceFlows.length > 1;

    outgoingSequenceFlows.forEach(function(outgoingSequenceFlow){
        if (emittedToken) return;

       if (isDiverging) {
            if (outgoingSequenceFlow.name) {
                var handlerName = currentGateway.name + ":" + outgoingSequenceFlow.name;
                if (self._callHandler(handlerName, data)) {
                    self._emitTokenAlong(outgoingSequenceFlow, data);
                    emittedToken = true;
                }
            } else {
                throw new Error("Cannot calculate handler name for gateway '" +
                    currentGateway.name + "' because it has unnamed outgoing transitions.");
            }
        } else {
            self._emitTokenAlong(outgoingSequenceFlow, data);
            emittedToken = true;
        }
     });
};

/**
 * @param {BPMNCallActivity} currentCallActivity
 * @param {Boolean} returningFromSubprocess
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokensAtCallActivity = function(currentCallActivity, data, returningFromSubprocess) {
    var self = this;
    if (returningFromSubprocess) {
        self._emitTokensAt(currentCallActivity, data);
    } else {
        var callActivityName = currentCallActivity.name;
        var subprocessId = this.processId + "::" + callActivityName;
        var bpmnFilePath = currentCallActivity.location;
        var processDefinition = bpmnProcessDefinitionModule.getBPMNProcessDefinition(bpmnFilePath);

        var handlerName = mapName2HandlerName(callActivityName);
        var mockupHandler = this._getHandler(handlerName);
        var handler = mockupHandler && typeof mockupHandler === "object" ? mockupHandler : getHandlerFromFile(bpmnFilePath);
        handler.doneLoadingHandler = handler.doneLoadingHandler || self.doneLoadingHandler;
        handler.doneSavingHandler = handler.doneSavingHandler || self.doneSavingHandler;

        // For sub-processes the history becomes hierarchical
        var historyEntry = {};
        historyEntry[callActivityName] = [];
        this.history.push(historyEntry);

        // At atomic states we would just emit tokens from here. But this is a hierarchical activity that starts
        // a subprocess. To model this, we create a token representing the callActivity.
        // This token holds the state in the current process (= its position) and the state of the whole subprocess
        var state = self.state;
        var callActivityToken = state.createTokenAt(callActivityName, this.processId);
        var subprocess = createBPMNProcess(subprocessId, processDefinition, handler,
            this.persistency, this, callActivityToken, historyEntry[callActivityName]);
        callActivityToken.substate = subprocess.getState();

        var startEvents = processDefinition.getStartEvents();
        if (startEvents.length === 1) {
            subprocess.sendStartEvent(startEvents[0].name);
        } else {
            throw Error("The sub-process '" + processDefinition.name + "' must have exactly one start event.");
        }
    }
};

/**
 * @param {BPMNEndEvent} endEvent
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokensAtEndEvent = function(endEvent, data) {
    var parentProcess = this.parentProcess;
    if (parentProcess) {
       var currentCallActivityName = this.parentToken.position;
       parentProcess._emitEvent(activityFinishedEvent, currentCallActivityName, data);
    }
};

/**
 * @param {BPMNFlowObject} currentGateway
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokensAtParallelGateway = function(currentGateway, data) {
    var self = this;
    var state = self.state;

    state.createTokenAt(currentGateway.name, this.processId);

    var numberOfIncomingFlows = this.processDefinition.getIncomingSequenceFlows(currentGateway).length;
    var numberOfTokens = state.numberOfTokensAt(currentGateway);
    if (numberOfTokens === numberOfIncomingFlows) {
        state.removeAllTokensAt(currentGateway);
        var outgoingSequenceFlows = this.processDefinition.getOutgoingSequenceFlows(currentGateway);
        outgoingSequenceFlows.forEach(function(outgoingSequenceFlow){
            self._emitTokenAlong(outgoingSequenceFlow, data);
        });
    }
};

/**
 * @param {BPMNSequenceFlow} outgoingSequenceFlow
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokenAlong = function(outgoingSequenceFlow, data) {
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

    // TODO: should we use the currentActivity in the name as well?
    var timerEventName = timerBoundaryEvent.name;
    var getTimeoutHandlerName = timerEventName + getTimeoutHandlerPostfix;
    var timeout = self._callHandler(getTimeoutHandlerName);
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
                currentProcess._callHandler(handlerName, data, activityFinishedHandlerIsDone);
            } else {
                self._callDefaultEventHandler(activityFinishedEvent, activityName, handlerName, "Found no outgoing flow.");
            }
        } else {
            self._callDefaultEventHandler(activityFinishedEvent, activityName, handlerName, "Process cannot handle this activity because it is not currently executed.");
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
        self._callHandler(currentFlowObjectName, data, handlerDone);
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
 * @param {String} name
 * @param {Object=} data
 * @param {Function=} handlerDoneCallback
 * @private
 */
BPMNProcess.prototype._callHandler = function(name, data, handlerDoneCallback) {
    var result = undefined;
    var done = handlerDoneCallback || function() {};
    var eventType = "callHandler";

    var handlerName = mapName2HandlerName(name);
    var handler = this._getHandler(handlerName);
    if (handler) {
        var handlerType = typeof handler;
        if (handlerType === 'function') {
            try {
                result = handler.call(this.processClient, data, done);
            } catch (error) {
                this.defaultErrorHandler.call(this.processClient, error);
            }
        } else if (handlerType === 'object') {
            // hierarchical handler used for mocking up sub process handlers. See test cases for examples
            // To keep going we have to call done()
            done();
        } else {
            this._callDefaultEventHandler(eventType, null, handlerName, "Unknown handler type: '" + handlerType + "'", done);
        }
     } else {
        this._callDefaultEventHandler(eventType, null, handlerName, "No handler found", done);
    }

    return result;
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {String} reason
 * @param {Function=} done
 * @private
 */
BPMNProcess.prototype._callDefaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason, done) {
    this.defaultEventHandler.call(this.processClient, eventType, currentFlowObjectName, handlerName, reason, done);
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {String} reason
 */
function logDefaultedEvents(eventType, currentFlowObjectName, handlerName, reason) {
    if (currentFlowObjectName) {
        console.log("Unhandled event: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'. Reason: " + reason);
    } else {
        console.log("Unhandled event: '" + eventType + "'. Handler name: " + handlerName + "'. Reason: " + reason);
    }
}

/**
 * @param {{toString, stack}} error
 */
function logDefaultedErrors(error) {
    console.log("Unhandled error: '" + error + "' Stack trace: " + error.stack);
}

/**
 * @param {String} bpmnFilePath
 * @type {String}
 */
exports.getHandlerFileName = getHandlerFileName = function(bpmnFilePath) {
    return (fileUtilsModule.removeFileExtension(bpmnFilePath) + ".js");
};

/**
 * @param {String} handlerName
 * @return {Function | Object}
 * @private
 */
BPMNProcess.prototype._getHandler = function(handlerName) {
    return this.eventHandler[handlerName]; // this works as long as event names are unique
};

/**
 * @param {String} bpmnFilePath
 * @type {Object}
 */
exports.getHandler = getHandlerFromFile = function(bpmnFilePath) {
    var handlerFilePath = getHandlerFileName(bpmnFilePath);
    return require(handlerFilePath);
};

/**
 * Replace all non-allowed characters with '_', if the name starts with a number prefix it with '_'
 * @param {String} name
 * @type {String}
 */
exports.mapName2HandlerName = mapName2HandlerName = function(name) {
    // TODO
    return name;
};



