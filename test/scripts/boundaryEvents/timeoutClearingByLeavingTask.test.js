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

exports.testClearBPMNTimeoutByLeavingTask = function(test) {
    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3");
    boundaryEvent.isTimerEvent = true;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addFlowObject(new BPMNEndEvent("_9", "MyEnd2", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_3", "_9"));

    var bpmnProcess;

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyStart",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: state at MyStart"
            );
            done(data);
        },
        "MyTask": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);
        },
        "MyTaskDone": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);
        },
        "MyTimeout$getTimeout": function() {
            test.ok(true, "testClearBPMNTimeoutByLeavingTask: getTimeout has been called");

            var maxTimeout = 360 * 24 * 3600 * 1000;
            process.nextTick(function() {
                var myTimeout = bpmnProcess.pendingTimeouts.getTimeout("MyTimeout");
                var myTimeoutValue = myTimeout ? myTimeout.timeout : -1;
                test.equal(myTimeoutValue,
                    maxTimeout,
                    "testClearBPMNTimeoutByLeavingTask: maxTimeout"
                );
                bpmnProcess.taskDone("MyTask");
            });
            return maxTimeout;
        },
        "MyTimeout": function(data, done) {
            test.ok(false, "testClearBPMNTimeoutByLeavingTask: should never be here");
            done(data);
        },
        "MyEnd2": function(data, done) {

            var hasTimeouts = bpmnProcess.pendingTimeouts.hasTimeouts();
            test.ok(!hasTimeouts,
                "testClearBPMNTimeoutByLeavingTask: active timers should be empty"
            );
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyEnd2",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: state at MyEnd"
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
                        "name": "MyEnd2"
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: history at MyEnd"
            );
            done(data);

            test.done();
        }
    };

    bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstProcess", processDefinition, handler);

    bpmnProcess.sendEvent("MyStart");

};
