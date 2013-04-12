/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Persistency = require('./persistency.js').Persistency;
var BPMNProcessState = require("./processState.js").BPMNProcessState;

var tokenEvent = "tokenEvent";
var taskDoneEvent = "taskDoneEvent";
var taskDoneHandlerPostfix = "Done";
var handlerDoneEvent = "handlerDoneEvent";

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
    this.persistency = persistency;
    this.processInstanceId = this.processDefinition.name + "::" + id;
    this.deferredEvents = [];
    this.deferEvents = false; // events must be deferred if the process engine is loading or saving state

    var self = this;
    var defaultEventHandler = function(eventName, done) {
        console.log("Unhandled event: '" + eventName + "'");
        if (done) {
            done.call(self);
        }
    };
    var defaultErrorHandler = function(error) {
        console.log("Unhandled error: '" + error + "' Stack trace: " + error.stack);
    };

    this.defaultEventHandler = eventHandler.defaultEventHandler || defaultEventHandler;
    this.defaultErrorHandler = eventHandler.defaultErrorHandler || defaultErrorHandler;

    this._registerTokenEvent();
    this._registerHandlerDoneEvent();
    this._registerTaskDoneEvent();
}

util.inherits(BPMNProcess, EventEmitter);

/**
 * @param {String} eventName
 * @param {Object} data
 */
BPMNProcess.prototype.emitEvent = function(eventName, data) {
    var flowObject = this.processDefinition.getFlowObjectByName(eventName);
    this._emitTokenFrom(flowObject, data);
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object} data
 */
BPMNProcess.prototype._emitTokenFrom = function(currentFlowObject, data) {
    this.state.createTokenAt(currentFlowObject);
    this._emitEvent(tokenEvent, currentFlowObject.name, data);
};

/**
 * @param {String} taskName
 * @param {Object} data
 */
BPMNProcess.prototype.taskDone = function(taskName, data) {
    this._emitEvent(taskDoneEvent, taskName, data);
};

/**
 * @param {Function(taskName, data)} callback
 */
BPMNProcess.prototype.onTaskDone = function(callback) {
    this.on(taskDoneEvent, callback);
};

/**
 * @param {Function(eventName, data)} callback
 */
BPMNProcess.prototype.onTokenEvent = function(callback) {
    this.on(tokenEvent, callback);
};

/**
 * Returns all current process flowObjects (tasks, events, ...)
 * @return {Array.<BPMNFlowObject>}
 */
BPMNProcess.prototype.getState = function() {
    return this.state;
};

/**
 * @param {Function(error, savedData)} done
 */
BPMNProcess.prototype.persist = function(done) {
    if (this.persistency) {
        this.deferEvents = true;
        var self = this;
        var doneSaving = function(error, savedData) {
            self._emitDeferredEvents();
            if (done) {
                done.call(self, error, savedData);
            }
        };
        this.persistency.persist(this, doneSaving);
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
                    self.data = loadedData.data;
                    self.state = new BPMNProcessState(loadedData.state);
                }
            }
            if (done) {
                done.call(self, error, loadedData);
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
 * @param {String} tokenPosition
 * @private
 */
BPMNProcess.prototype._getFlowObjectByTokenPosition = function(tokenPosition) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = this.processDefinition;
    // Here we implement the assumption that we can map each flow object name uniquely to a bpmn ID
    var bpmnId = processDefinition.getIdByName(tokenPosition);

    return processDefinition.getProcessElement(bpmnId);
};

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitNextTokens = function(currentFlowObject, data) {
    var self = this;
    self.state.removeTokenAt(currentFlowObject);
    if (currentFlowObject.isExclusiveGateway) {
        self._emitTokensAtExclusiveGateway(currentFlowObject, data);
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
    var nextFlowObjects = this.processDefinition.getNextFlowObjects(currentFlowObject);
    nextFlowObjects.forEach(function(nextFlowObject) {
        self._emitTokenFrom(nextFlowObject, data);
    });
};

/**
 * @param {BPMNFlowObject} currentGateway
 * @param {BPMNSequenceFlow} incomingFlow
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokenAtGateway = function(currentGateway, incomingFlow, data) {
    var processDefinition = this.processDefinition;
    var nextFlowObject = processDefinition.getProcessElement(incomingFlow.targetRef);
    if (nextFlowObject) {
        this._emitTokenFrom(nextFlowObject, data);
    } else {
        throw new Error("Cannot find the next flow object (task, gateway, ...) with BPMN id = '" +
            incomingFlow.targetRef + "' for gateway '" + currentGateway.name + "'");
    }
};

BPMNProcess.prototype._getOutgoingFlow = function(outgoingRef, currentFlowObject) {
    var flow = this.processDefinition.getProcessElement(outgoingRef);
    if (!flow) {
        throw new Error("Cannot find the outgoing flow with BPMN id = '" +
            outgoingRef + "' for gateway '" + currentFlowObject.name + "'");
    }
    return flow;
};

/**
 * @param {BPMNFlowObject} currentGateway
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitTokensAtExclusiveGateway = function(currentGateway, data) {
    var self = this;
    var emittedToken = false;
    var isDiverging = currentGateway.isDiverging();

    currentGateway.outgoingRefs.forEach(function(outgoingRef){
        if (emittedToken) return;

        var flow = self._getOutgoingFlow(outgoingRef, currentGateway);
        if (isDiverging) {
            if (flow.name) {
                var handlerName = currentGateway.name + ":" + flow.name;
                if (self._callHandler(handlerName, data)) {
                    self._emitTokenAtGateway(currentGateway, flow, data);
                    emittedToken = true;
                }
            } else {
                throw new Error("Cannot calculate handler name for gateway '" +
                    currentGateway.name + "' because it has unnamed outgoing transitions.");
            }
        } else {
            self._emitTokenAtGateway(currentGateway, flow, data);
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

    var numberOfIncomingFlows = currentGateway.getNumberOfIncomingFlows();
    var numberOfTokens = state.numberOfTokensAt(currentGateway);
    if (numberOfTokens === numberOfIncomingFlows) {
        state.removeAllTokensAt(currentGateway);
        currentGateway.outgoingRefs.forEach(function(outgoingRef){
            var flow = self._getOutgoingFlow(outgoingRef, currentGateway);
            self._emitTokenAtGateway(currentGateway, flow, data);
        });
    }
};

/**
 * @private
 */
BPMNProcess.prototype._registerHandlerDoneEvent = function() {
    var self = this;
    self.on(handlerDoneEvent, function(eventName, data) {
       var currentFlowObject = self._getFlowObjectByTokenPosition(eventName);
       // for "...Done" events we do not find associated flowObjects, thus we have to check currentFlowObject
       if (currentFlowObject) {
           if (currentFlowObject.waitForTaskDoneEvent) {
               // We use the same persistency strategy as e.g. Activity: we persist at wait states
               self.persist();
           } else {
               self._emitNextTokens(currentFlowObject, data);
           }
       }
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerTaskDoneEvent = function() {
    var self = this;
    self.onTaskDone(function(taskName, data) {
        if (this._acceptTaskDoneEvent(taskName)) {
            self._callHandler(taskName + taskDoneHandlerPostfix, data);
            var currentTask = this._getFlowObjectByTokenPosition(taskName);
            self._emitNextTokens(currentTask, data);
        } else {
            self.defaultEventHandler(taskName);
        }
      });
};


/**
 * @private
 */
BPMNProcess.prototype._registerTokenEvent = function() {
    var self = this;
    self.onTokenEvent(function(tokenPosition, data) {
        self._callHandler(tokenPosition, data);
    });
};

/**
 * @param {String} taskName
 * @return {Boolean}
 * @private
 */
BPMNProcess.prototype._acceptTaskDoneEvent = function(taskName) {
    var currentTask = this._getFlowObjectByTokenPosition(taskName);
    return this.state.hasTokensAt(currentTask);
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
 * @param {String} tokenPosition
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._callHandler = function(tokenPosition, data) {
    var result = undefined;
    var self = this;
    var done = function(data) {
        self._emitEvent(handlerDoneEvent, tokenPosition, data);
    };

    var handler = this.eventHandler[tokenPosition]; // this works as long as event names are unique
    if (handler && typeof handler === 'function') {
        try {
            // handlers on conditional connection elements return booleans
            result = handler.call(this, data, done);
        } catch (error) {
            this.defaultErrorHandler.call(this, error);
        }
    } else {
        this.defaultEventHandler.call(this, tokenPosition, done);
    }

    return result;
};
