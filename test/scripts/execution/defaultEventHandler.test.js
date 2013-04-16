/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcess = require('../../../lib/execution/process.js').BPMNProcess;
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNBoundaryEvent = require("../../../lib/bpmn/boundaryEvents.js").BPMNBoundaryEvent;


exports.testIncorrectTaskDoneEvent = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyStart"
                    }
                ],
                "testIncorrectTaskDoneEvent: state at MyStart"
            );
            done(data);
        },
        "MyTask": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask"
                    }
                ],
                "testIncorrectTaskDoneEvent: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);

            bpmnProcess.taskDone("MyTask");
        },
        "MyTaskDone": function(data, done) {
            test.ok(false, "testIncorrectTaskDoneEvent: we should never reach this");
            test.done();
            done(data);
        },
        "defaultEventHandler": function(eventName) {
            test.equal(eventName, "MyTask", "testIncorrectTaskDoneEvent: state at MyEnd");

            var history = this.getHistory();
            test.deepEqual(history,
                [
                    "MyStart",
                    "MyTask"
                ],
                "testIncorrectTaskDoneEvent: history at MyEnd"
            );

            test.done();
        }
    };

    var bpmnProcess = new BPMNProcess("myFirstProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("MyStart");

};