/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../lib/process.js');
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNBoundaryEvent = require("../../../lib/bpmn/boundaryEvents.js").BPMNBoundaryEvent;

exports.testBPMNTimeout = function(test) {
    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3");
    boundaryEvent.isTimerEvent = true;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyStart",
                        "substate": null,
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testBPMNTimeout: state at MyStart"
            );
            done(data);
        },
        "MyTask": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "substate": null,
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testBPMNTimeout: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);
        },
        "MyTimeout$getTimeout": function() {
            test.ok(true, "testBPMNTimeout: getTimeout has been called");
            return 1000.11;
        },
        "MyTimeout": function(data, done) {
            var activeTimers = bpmnProcess.activeTimers;
            test.deepEqual(activeTimers.MyTimeout._idleTimeout,
                1000,
                "testClearBPMNTimeoutByLeavingTask: active timers should be empty"
            );

            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "MyStart"
                    },
                    {
                        "name": "MyTask"
                    },
                    {
                        "name": "MyTimeout"
                    }
                ],
                "testBPMNTimeout: history at MyTimeout"
            );

            done(data);
        },
        "MyEnd": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyEnd",
                        "substate": null,
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testBPMNTimeout: state at MyEnd"
            );
            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "MyStart"
                    },
                    {
                        "name": "MyTask"
                    },
                    {
                        "name": "MyTimeout"
                    },
                    {
                        "name": "MyEnd"
                    }
                ],
                "testBPMNTimeout: history at MyEnd"
            );
            done(data);

            test.done();
        }
    };

    bpmnProcessModule.clearActiveProcessesCache();
    var bpmnProcess = bpmnProcessModule._createBPMNProcess("myFirstProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("MyStart");

};

exports.testBPMNWrongGetTimeoutResponse = function(test) {
    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3");
    boundaryEvent.isTimerEvent = true;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));

    var timeout = "1000x";

    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MyTask": function(data, done) {
            done(data);
        },
        "MyTimeout$getTimeout": function() {
            test.ok(true, "testBPMNWrongGetTimeoutResponse: getTimeout has been called");
            return timeout;
        },
        "MyTimeout": function(data, done) {
            test.ok(false, "testBPMNWrongGetTimeoutResponse: shouldn't get here");
            done(data);
        },
        "MyEnd": function(data, done) {
            test.ok(false, "testBPMNWrongGetTimeoutResponse: shouldn't get here");
            done(data);
        },
        "defaultErrorHandler": function(error) {
            test.ok(true, "testBPMNWrongGetTimeoutResponse: called default error handler");

            test.equal(error.message,
                "The getTimeout handler 'MyTimeout$getTimeout' does not return a number but '1000x'",
                "testBPMNWrongGetTimeoutResponse: test error message.");
            test.done();
        }
    };

    bpmnProcessModule.clearActiveProcessesCache();
    var bpmnProcess = bpmnProcessModule._createBPMNProcess("myFirstProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("MyStart");

};