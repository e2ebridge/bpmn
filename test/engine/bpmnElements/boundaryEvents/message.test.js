/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../../lib/process.js');
var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNBoundaryEvent = require("../../../../lib/parsing/boundaryEvents.js").BPMNBoundaryEvent;

exports.testBPMNMessageBoundaryEvent = function(test) {
    var bpmnProcess;

    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyMessageBoundaryEvent", "boundaryEvent", "_3");
    boundaryEvent.isMessageEvent = true;

    var myTask = new BPMNTask("_3", "MyTask", "task");

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(myTask);
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
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testBPMNMessageBoundaryEvent: state at MyStart"
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
                "testBPMNMessageBoundaryEvent: state at MyTask"
            );

            var boundaryEvents = bpmnProcess.processDefinition.getBoundaryEventsAt(myTask);
            test.ok(boundaryEvents.length === 1,
                "testBPMNMessageBoundaryEvent: at MyTask: there should be one boundary event"
            );

            bpmnProcess.triggerEvent("MyMessageBoundaryEvent", {gugus: "blah"});
            done(data);
        },
        "MyMessageBoundaryEvent": function(data, done) {

            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyMessageBoundaryEvent",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testBPMNMessageBoundaryEvent: state at MyEnd"
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
                        "name": "MyMessageBoundaryEvent"
                    }
                ],
                "testBPMNMessageBoundaryEvent: history at MyMessageBoundaryEvent"
            );

            done(data);
        },
        "MyEnd": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyEnd",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testBPMNMessageBoundaryEvent: state at MyEnd"
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
                        "name": "MyMessageBoundaryEvent"
                    },
                    {
                        "name": "MyEnd"
                    }
                ],
                "testBPMNMessageBoundaryEvent: history at MyEnd"
            );
            done(data);

            test.done();
        }
    };

    bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstProcess", processDefinition, handler);

    bpmnProcess.triggerEvent("MyStart");

};
