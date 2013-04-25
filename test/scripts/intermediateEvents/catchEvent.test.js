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
var BPMNExclusiveGateway = require("../../../lib/bpmn/gateways.js").BPMNExclusiveGateway;
var BPMNIntermediateCatchEvent = require("../../../lib/bpmn/intermediateEvents.js").BPMNIntermediateCatchEvent;


exports.testIntermediateThrowEvent = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myIntermediateCatchEventTestProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNIntermediateCatchEvent("_3", "My Intermediate Catch Event", "intermediateCatchEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "End Event", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var handler = {
        "Start_Event": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "Start Event",
                        "substate": null,
                        "owningProcessId": "myIntermediateCatchEventTestProcess"
                    }
                ],
                "testIntermediateThrowEvent: state at Start Event"
            );
            done(data);
        },
        "My_Intermediate_Catch_Event": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "My Intermediate Catch Event",
                        "substate": null,
                        "owningProcessId": "myIntermediateCatchEventTestProcess"
                    }
                ],
                "testIntermediateThrowEvent: state at My Intermediate Catch Event"
            );
            done(data);
        },
        "End_Event": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "End Event",
                        "substate": null,
                        "owningProcessId": "myIntermediateCatchEventTestProcess"
                    }
                ],
                "testIntermediateThrowEvent: state at End Event"
            );
            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "Start Event"
                    },
                    {
                        "name": "My Intermediate Catch Event"
                    },
                    {
                        "name": "End Event"
                    }
                ],
                "testIntermediateThrowEvent: history at End Event"
            );
            done(data);

            test.done();
        }
    };

    var bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myIntermediateCatchEventTestProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("Start Event");

    process.nextTick(function() {
        bpmnProcess.sendEvent("My Intermediate Catch Event");
    });

};