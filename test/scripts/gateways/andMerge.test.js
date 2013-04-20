/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../lib/process.js');
var Persistency = require('../../../lib/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNParallelGateway = require("../../../lib/bpmn/gateways.js").BPMNParallelGateway;

exports.testAndMerge = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event1", "startEvent"));
    processDefinition.addFlowObject(new BPMNStartEvent("_3", "Start Event2", "startEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_9", "End Event", "endEvent"));
    processDefinition.addFlowObject(new BPMNParallelGateway("_4", "Parallel Converging Gateway", "exclusiveGateway"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_4", "_9"));

    var log = function(eventType) {
        //console.log("testAndMerge: Calling handler for '" + eventType + "'");
    };

    var counter = 0;
    var testOk = function(process) {
        test.equal(counter, 2, "testAndMerge: reached end event after start event1 AND start event2");

        var state = process.getState();
        test.deepEqual(state.tokens,
            [],
            "testAndMerge: state after merging start event1 and start event2")
        ;
        test.done();
    };
    var handler = {
        "Start_Event1": function(data, done) {
            log("Start Event1");
            counter++;
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "Start Event1",
                        "substate": null,
                        "owningProcessId": "myFirstConvergingParallelGatewayProcess"
                    }
                ],
                "testAndMerge: state after Start Event1"
            );
            done(data);
        },
        "Start_Event2": function(data, done) {
            log("Start Event2");
            counter++;
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "Parallel Converging Gateway",
                        "substate": null,
                        "owningProcessId": "myFirstConvergingParallelGatewayProcess"
                    },
                    {
                        "position": "Start Event2",
                        "substate": null,
                        "owningProcessId": "myFirstConvergingParallelGatewayProcess"
                    }
                ],
                "testAndMerge: state after Start Event2"
            );

            //setTimeout(function() {done(data);}, 2000);
            done(data);
        },
        "Parallel_Converging_Gateway": function(data, done) {
            log("Exclusive Converging Gateway");
            done(data);
        },
        "End_Event": function(data, done) {
            log("End Event");
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "End Event",
                        "substate": null,
                        "owningProcessId": "myFirstConvergingParallelGatewayProcess"
                    }
                ],
                "testAndMerge: at End Event"
            );

            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "Start Event1"
                    },
                    {
                        "name": "Parallel Converging Gateway"
                    },
                    {
                        "name": "Start Event2"
                    },
                    {
                        "name": "Parallel Converging Gateway"
                    },
                    {
                        "name": "End Event"
                    }]                ,
                "testAndMerge: history at End Event"
            );

            done(data);
            testOk(this);
        }
    };

    var bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstConvergingParallelGatewayProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("Start Event1");
    bpmnProcess.sendStartEvent("Start Event2");

};
