/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../lib/execution/process.js');
var Persistency = require('../../../lib/execution/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../lib/bpmn/gateways.js").BPMNExclusiveGateway;

exports.testExclusiveConvergingGateway = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event1", "startEvent"));
    processDefinition.addFlowObject(new BPMNStartEvent("_3", "Start Event2", "startEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_9", "End Event", "endEvent"));
    processDefinition.addFlowObject(new BPMNExclusiveGateway("_4", "Exclusive Converging Gateway", "exclusiveGateway"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_4", "_9"));

    var log = function(eventType) {
        //console.log("testExclusiveConvergingGateway: Calling handler for '" + eventType + "'");
    };

    var finalTest = false;

    var handler = {
        "Start_Event1": function(data, done) {
            log("Start_Event1");
            done(data);
        },
        "Start_Event2": function(data, done) {
            log("Start_Event2");
            done(data);
        },
        "Exclusive_Converging_Gateway": function(data, done) {
            log("Exclusive Converging Gateway");
            done(data);
        },
        "End_Event": function(data, done) {
            log("End_Event");
            done(data);
            test.ok(true, "testExclusiveConvergingGateway: reached End_Event");

            var history = this.getHistory();

            if (finalTest) {
                test.deepEqual(history.historyEntries,
                    [
                        {
                            "name": "Start Event2"
                        },
                        {
                            "name": "Exclusive Converging Gateway"
                        },
                        {
                            "name": "End Event"
                        }
                    ],
                    "testExclusiveConvergingGateway: history at End Event"
                );

                test.done();
            } else {
                test.deepEqual(history.historyEntries,
                    [
                        {
                            "name": "Start Event1"
                        },
                        {
                            "name": "Exclusive Converging Gateway"
                        },
                        {
                            "name": "End Event"
                        }
                    ],
                    "testExclusiveConvergingGateway: history at End Event"
                );
            }

        }
    };

    var bpmnProcess = bpmnProcessModule.createBPMNProcess("myFirstConvergingXorGatewayProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("Start Event1");

    var bpmnProcess2 = bpmnProcessModule.createBPMNProcess("myFirstConvergingXorGatewayProcess2", processDefinition, handler);

    finalTest = true;

    bpmnProcess2.sendStartEvent("Start Event2");

};