/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../lib/execution/process.js');
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
                        "position": "MyStart",
                        "substate": null,
                        "owningProcessId": "myFirstProcess"
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
                        "position": "MyTask",
                        "substate": null,
                        "owningProcessId": "myFirstProcess"
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
        "defaultEventHandler": function(eventType, flowObjectName, handlerName, reason) {
            test.equal(eventType, "activityFinishedEvent", "testIncorrectTaskDoneEvent: defaultEventHandler: eventType");
            test.equal(flowObjectName, "MyTask", "testIncorrectTaskDoneEvent: defaultEventHandler: flowObjectName");
            test.equal(handlerName, "MyTaskDone", "testIncorrectTaskDoneEvent: defaultEventHandler: handlerName");
            test.equal(reason, "Found no outgoing flow.", "testIncorrectTaskDoneEvent: defaultEventHandler: reason");

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

    var bpmnProcess = bpmnProcessModule.createBPMNProcess("myFirstProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("MyStart");

};