/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Persistency = require('./persistency.js').Persistency;
var BPMNProcessState = require("./processState.js").BPMNProcessState;
var BPMNProcessClient = require("./processClient.js").BPMNProcessClient;

var tokenArrivedEvent = "tokenArrivedEvent";
var activityFinishedEvent = "activityFinishedEvent";

var activityFinishedHandlerPostfix = "Done";
var getTimeoutHandlerPostfix = ":getTimeout";

exports.BPMNProcess = BPMNProcess;

/**
 * @param {String} id
 * @param {BPMNProcessDefinition} processDefinition
 * @param {Object} eventHandler This object should contain event handler for all BPMN events
 * @param {Persistency=} persistency
 * @constructor
 */
function BPMNProcess(id, processDefinition, eventHandler, persistency) {
    this.processDefinition = processDefinition;
    this.eventHandler = eventHandler;
    this.state = new BPMNProcessState();
    this.data = {};
    this.history = [];
    this.persistency = persistency;
    this.processInstanceId = this.processDefinition.name + "::" + id;
    this.deferredEvents = [];
    this.activeTimers = {};
    this.deferEvents = false; // events must be deferred if the process engine is loading or saving state
    this.processClient = new BPMNProcessClient(this);

    var self = this;
    var defaultEventHandler = function(eventName, done) {
        console.log("Unhandled event: '" + eventName + "'. Possible reasons: process in wrong state, no active outgoing flows, etc.");
        if (done) {
            done.call(self.processClient);
        }
    };
    var defaultErrorHandler = function(error) {
        console.log("Unhandled error: '" + error + "' Stack trace: " + error.stack);
    };

    this.defaultEventHandler = eventHandler.defaultEventHandler || defaultEventHandler;
    this.defaultErrorHandler = eventHandler.defaultErrorHandler || defaultErrorHandler;
    this.doneSavingHandler = eventHandler.doneSavingHandler;

    this._registerOnTokenArrivedEvent();
    this._registerActivityFinishedEvent();
}

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
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object=} data
 */
BPMNProcess.prototype._putTokenAt = function(currentFlowObject, data) {
    this.state.createTokenAt(currentFlowObject);
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
                self.doneSavingHandler(error, savedData);
            }
        };
        var persistentData = {
            processInstanceId: this.processInstanceId,
            data: this.data,
            state: this.state,
            history: this.history
        };
        this.persistency.persist(persistentData, doneSaving);
    }
};

/**
 * @param {Function(error, savedData)} done
 */
BPMNProcess.prototype.loadState = function(done) {
    if (this.persistency) {
        this.deferEvents = true;
        var self = this;
        var doneLoading = function(error, loadedData) {
            if (error) {
                throw error;
            } else {
                if (loadedData) {
                    self.data = loadedData.data || {};
                    self.state = new BPMNProcessState(loadedData.state);
                    self.history = loadedData.history || [];
                }
            }
            if (done) {
                done.call(self.processClient, error, loadedData);
            }
            // MUST be AFTER the external handler because
            // we DEFINE the behaviour that after loading
            // no deferred events have been emitted
            self._emitDeferredEvents();
        };
        this.persistency.load(this.processInstanceId, doneLoading);
    }
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
 * @private
 */
BPMNProcess.prototype._emitNextTokens = function(currentFlowObject, data) {
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
 * @param {BPMNFlowObject} currentGateway
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokensAtParallelGateway = function(currentGateway, data) {
    var self = this;
    var state = self.state;

    state.createTokenAt(currentGateway);

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
        if (this._acceptActivityFinishedEvent(activityName)) {
            var activityFinishedHandlerIsDone = function(data) {
                var currentTask = self.processDefinition.getFlowObjectByName(activityName);
                self._emitNextTokens(currentTask, data);
            };
            self._callHandler(activityName + activityFinishedHandlerPostfix, data, activityFinishedHandlerIsDone);
        } else {
            self.defaultEventHandler(activityName);
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
 * @param {String} taskName
 * @return {Boolean}
 * @private
 */
BPMNProcess.prototype._acceptActivityFinishedEvent = function(taskName) {
    var currentTask = this.processDefinition.getFlowObjectByName(taskName);
    var hasTokens = this.state.hasTokensAt(currentTask);
    var hasOutgoingFlows = this.processDefinition.getNextFlowObjects(currentTask).length > 0;
    return (hasTokens && hasOutgoingFlows);
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
 * @param {String} handlerName
 * @param {Object=} data
 * @param {Function=} handlerDoneCallback
 * @private
 */
BPMNProcess.prototype._callHandler = function(handlerName, data, handlerDoneCallback) {
    var result = undefined;
    var done = handlerDoneCallback || function() {};

    var handler = this.eventHandler[handlerName]; // this works as long as event names are unique
    if (handler && typeof handler === 'function') {
        try {
            result = handler.call(this.processClient, data, done);
         } catch (error) {
            this.defaultErrorHandler.call(this.processClient, error);
        }
    } else {
        this.defaultEventHandler.call(this.processClient, handlerName, done);
    }

    return result;
};
