/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Persistency = require('./persistency.js').Persistency;

var processEvent = "processEvent";
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
    /** @type {Array.<BPMNFlowObject>} */
    this.state = []; // current process flowObjects (tasks, events, ...)
    this.expectedEventsMap = {}; // maps node names to number of expected events. E.g. a parallel gateway
    this.data = {};
    this.persistency = persistency;
    this.processInstanceId = this.processDefinition.name + "::" + id;
    this.deferredEvents = [];
    this.deferEvents = false; // events must be deferred if the process engine is loading or saving state

    var defaultEventHandler = function(eventName, done) {
        console.log("Unhandled event: '" + eventName + "'");
        if (done) done();
    };
    var defaultErrorHandler = function(error) {
        console.log("Unhandled error: '" + error + "' Stack trace: " + error.stack);
    };

    this.defaultEventHandler = eventHandler.defaultEventHandler || defaultEventHandler;
    this.defaultErrorHandler = eventHandler.defaultErrorHandler || defaultErrorHandler;

    this._registerProcessEvent();
    this._registerHandlerDoneEvent();
    this._registerTaskDoneEvent();
}

util.inherits(BPMNProcess, EventEmitter);

/**
 * @param {BPMNFlowObject} flowObject
 * @privat
 */
BPMNProcess.prototype._setNumberOfExpectedEvents = function(flowObject) {
    this.expectedEventsMap[flowObject.name] = flowObject.getNumberOfOutgoingFlows();
};

/**
 * @param {BPMNFlowObject} flowObject
 * @privat
 */
BPMNProcess.prototype._decrementNumberOfExpectedEvents = function(flowObject) {
    var name = flowObject.name;
    var numberOfExpectedEvents = this.expectedEventsMap[name];
    if (numberOfExpectedEvents && numberOfExpectedEvents > 0) {
        this.expectedEventsMap[name] = numberOfExpectedEvents - 1;
    }
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {int}
 * @private
 */
BPMNProcess.prototype._getNumberOfExpectedEvents = function(flowObject) {
    var numberOfExpectedEvents = this.expectedEventsMap[flowObject.name];
    if (!numberOfExpectedEvents) {
        numberOfExpectedEvents = 0;
    }
    return numberOfExpectedEvents;
};

/**
 * @param {String} eventName
 * @param {Object} data
 */
BPMNProcess.prototype.emitEvent = function(eventName, data) {
    this._emitEvent(processEvent, eventName, data);
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
BPMNProcess.prototype.onEvent = function(callback) {
    this.on(processEvent, callback);
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
                done(error, savedData);
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
                    self.state = loadedData.state;
                }
            }
            if (done) {
                done(error, loadedData);
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
 * @param {String} eventName
 * @private
 */
BPMNProcess.prototype._getFlowObjectByEventName = function(eventName) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = this.processDefinition;
    // Here we implement the assumption that we can map events to flowObjects!
    var bpmnId = processDefinition.getIdByName(eventName);

    return processDefinition.getProcessElement(bpmnId);
};

/**
 * Get event name that triggers the transition to a flow object (task, gateway, ...)
 * @param {String} flowObjectName
 * @return {String}
 */
function getEventNameFor(flowObjectName) {
    // We use the flow object name also as event name
    return flowObjectName;
}

/**
 * @param {BPMNFlowObject} currentFlowObject
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitNextEvents = function(currentFlowObject, data) {
    var self = this;
    if (currentFlowObject.isExclusiveGateway) {
        self._emitExclusiveGatewayEvents(currentFlowObject, data);
    } else if (currentFlowObject.isParallelGateway) {
        self._emitParallelGatewayEvents(currentFlowObject, data);
    } else {
        var nextFlowObjects = self.processDefinition.getNextFlowObjects(currentFlowObject);
        nextFlowObjects.forEach(function(nextFlowObject) {
            self.emitEvent(getEventNameFor(nextFlowObject.name), data);
        });
    }
};

/**
 * @param {BPMNFlowObject} currentGateway
 * @param {BPMNSequenceFlow} incomingFlow
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitGatewayEvent = function(currentGateway, incomingFlow, data) {
    var processDefinition = this.processDefinition;
    var nextFlowObject = processDefinition.getProcessElement(incomingFlow.targetRef);
    if (nextFlowObject) {
        this.emitEvent(getEventNameFor(nextFlowObject.name), data);
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
BPMNProcess.prototype._emitExclusiveGatewayEvents = function(currentGateway, data) {
    var self = this;
    var sentEvent = false;
    var isDiverging = currentGateway.isDiverging();

    currentGateway.outgoingRefs.forEach(function(outgoingRef){
        if (sentEvent) return;

        var flow = self._getOutgoingFlow(outgoingRef, currentGateway);
        if (isDiverging) {
            if (flow.name) {
                var handlerName = currentGateway.name + ":" + flow.name;
                if (self._callHandler(handlerName, data)) {
                    self._emitGatewayEvent(currentGateway, flow, data);
                    sentEvent = true;
                }
            } else {
                throw new Error("Cannot calculate handler name for gateway '" +
                    currentGateway.name + "' because it has unnamed outgoing transitions.");
            }
        } else {
            self._emitGatewayEvent(currentGateway, flow, data);
            sentEvent = true;
        }
     });
};

/**
 * @param {BPMNFlowObject} currentGateway
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._emitParallelGatewayEvents = function(currentGateway, data) {
    var self = this;
    currentGateway.outgoingRefs.forEach(function(outgoingRef){
        var flow = self._getOutgoingFlow(outgoingRef, currentGateway);
        self._emitGatewayEvent(currentGateway, flow, data);
    });
};

/**
 * @private
 */
BPMNProcess.prototype._registerHandlerDoneEvent = function() {
    var self = this;
    self.on(handlerDoneEvent, function(eventName, data) {
       var currentFlowObject = self._getFlowObjectByEventName(eventName);
       // for "...Done" events we do not find associated flowObjects, thus we have to check currentFlowObject
       if (currentFlowObject) {
           if (currentFlowObject.waitForTaskDoneEvent) {
               // We use the same persistency strategy as e.g. Activity: we persist at wait states
               self.persist();
           } else {
               self._emitNextEvents(currentFlowObject, data);
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
            var currentTask = this._getFlowObjectByEventName(taskName);
            self._emitNextEvents(currentTask, data);
        } else {
            self.defaultEventHandler(taskName);
        }
      });
};


/**
 * @private
 */
BPMNProcess.prototype._registerProcessEvent = function() {
    var self = this;
    self.onEvent(function(eventName, data) {
        if (this._acceptEvent(eventName)) {
            self._callHandler(eventName, data);
        } else {
            console.log("The event '" + eventName + "' has not been accepted.");
            self.defaultEventHandler(eventName);
        }
     });
};

/**
 * @param {String} taskName
 * @return {Boolean}
 * @private
 */
BPMNProcess.prototype._acceptTaskDoneEvent = function(taskName) {
    var accept = false;
    var currentTask = this._getFlowObjectByEventName(taskName);

    if (currentTask) {
        this.state.forEach(function(flowObject){
            if (flowObject.name === currentTask.name) {
                accept = true;
            }
        });
    }

    return accept;
};

/**
 * @param {String} eventName
 * @return {Boolean}
 * @private
 */
BPMNProcess.prototype._acceptEvent = function(eventName) {
    var accept = false;
    var self = this;
    var state = this.state;
    var newState = [];
    var processDefinition = this.processDefinition;
    var nextFlowObject = this._getFlowObjectByEventName(eventName);

    if (state.length === 0) {
        accept = isExpectedFlowObject(nextFlowObject, processDefinition.getStartEvents());
        if (accept) {
            newState.push(nextFlowObject);
            self._setNumberOfExpectedEvents(nextFlowObject);
        }
    } else {
        state.forEach(function(currentFlowObject) {
            var isExpected = isExpectedFlowObject(nextFlowObject, processDefinition.getNextFlowObjects(currentFlowObject));
            if (isExpected) {
                newState.push(nextFlowObject);
                self._setNumberOfExpectedEvents(nextFlowObject);
                self._decrementNumberOfExpectedEvents(currentFlowObject);
                if (self._getNumberOfExpectedEvents(currentFlowObject) > 0) {
                    // the current flow object still belongs to the current state because it still expects events
                    newState.push(currentFlowObject);
                }
                if (!accept) accept = true; // the event is accepted if at least one next flow object is expected
            } else {
                newState.push(currentFlowObject);
            }
        });
    }

    this.state = newState;

    return accept;
};

/**
 * @param {BPMNFlowObject} nextFlowObject
 * @param {Array.<BPMNFlowObject>} expectedFlowObjects
 * @return {Boolean}
 */
function isExpectedFlowObject(nextFlowObject, expectedFlowObjects) {
    var isExpected = false;

    if (nextFlowObject) {
        expectedFlowObjects.forEach(function(expectedFlowObject){
            if (expectedFlowObject.bpmnId === nextFlowObject.bpmnId) {
                isExpected = true;
            }
        });
    }

    return isExpected;
}

/**
 * @param eventType
 * @param eventName
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
 * @param {String} eventName
 * @param {Object} data
 * @private
 */
BPMNProcess.prototype._callHandler = function(eventName, data) {
    var result = undefined;
    var self = this;
    var done = function(data) {
        self._emitEvent(handlerDoneEvent, eventName, data);
    };

    var handler = this.eventHandler[eventName]; // this works as long as event names are unique
    if (handler && typeof handler === 'function') {
        try {
            // handlers on conditional connection elements return booleans
            result = handler.call(this, data, done);
        } catch (error) {
            this.defaultErrorHandler.call(this, error);
        }
    } else {
        this.defaultEventHandler.call(this, eventName, done);
    }

    return result;
};
