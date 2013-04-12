/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNProcessEngine = require('../../../lib/process.js').BPMNProcess;
var Persistency = require('../../../lib/persistency.js').Persistency;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../lib/bpmn/gateways.js").BPMNExclusiveGateway;

exports.testExclusiveConvergingGateway = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "Start Event1", "startEvent", [], ["_5"]));
    processDefinition.addStartEvent(new BPMNStartEvent("_3", "Start Event2", "startEvent", [], ["_6"]));
    processDefinition.addEndEvent(new BPMNEndEvent("_9", "End Event", "endEvent", ["_10"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_4", "_9"));
    processDefinition.addGateway(new BPMNExclusiveGateway("_4", "Exclusive Converging Gateway", "exclusiveGateway", ["_5", "_6"], ["_10"]));

    var log = function(eventType) {
        //console.log("testExclusiveConvergingGateway: Calling handler for '" + eventType + "'");
    };

    var finalTest = false;

    var handler = {
        "Start Event1": function(data, done) {
            log("Start Event1");
            done(data);
        },
        "Start Event2": function(data, done) {
            log("Start Event2");
            done(data);
        },
        "Exclusive Converging Gateway": function(data, done) {
            log("Exclusive Converging Gateway");
            done(data);
        },
        "End Event": function(data, done) {
            log("End Event");
            done(data);
            test.ok(true, "testExclusiveConvergingGateway: reached End Event");

            var history = this.getHistory();

            if (finalTest) {
                test.deepEqual(history,
                    [
                        "Start Event2",
                        "Exclusive Converging Gateway",
                        "End Event"
                    ],
                    "testExclusiveConvergingGateway: history at End Event"
                );

                test.done();
            } else {
                test.deepEqual(history,
                    [
                        "Start Event1",
                        "Exclusive Converging Gateway",
                        "End Event"
                    ],
                    "testExclusiveConvergingGateway: history at End Event"
                );
            }

        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstConvergingXorGatewayProcess", processDefinition, handler);

    bpmnProcess.emitEvent("Start Event1");

    var bpmnProcess2 = new BPMNProcessEngine("myFirstConvergingXorGatewayProcess2", processDefinition, handler);

    finalTest = true;

    bpmnProcess2.emitEvent("Start Event2");

};