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
var BPMNParallelGateway = require("../../../lib/bpmn/gateways.js").BPMNParallelGateway;

exports.testParallelConvergingGateway = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "Start Event1", "startEvent", [], ["_5"]));
    processDefinition.addStartEvent(new BPMNStartEvent("_3", "Start Event2", "startEvent", [], ["_6"]));
    processDefinition.addEndEvent(new BPMNEndEvent("_9", "End Event", "endEvent", ["_10"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_4", "_9"));
    processDefinition.addGateway(new BPMNParallelGateway("_4", "Parallel Converging Gateway", "exclusiveGateway", ["_5", "_6"], ["_10"]));

    var log = function(eventType) {
        //console.log("testParallelConvergingGateway: Calling handler for '" + eventType + "'");
    };

    var counter = 0;
    var testOk = function(process) {
        test.equal(counter, 2, "testParallelConvergingGateway: reached end event after start event1 AND start event2");

        var state = process.getState();
        test.deepEqual(state.tokens,
            [],
            "testParallelConvergingGateway: state after merging start event1 and start event2")
        ;
        test.done();
    };
    var handler = {
        "Start Event1": function(data, done) {
            log("Start Event1");
            counter++;
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "Start Event1"
                    }
                ],
                "testParallelConvergingGateway: state after Start Event1"
            );
            done(data);
        },
        "Start Event2": function(data, done) {
            log("Start Event2");
            counter++;
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "Parallel Converging Gateway"
                    },
                    {
                        "position": "Start Event2"
                    }
                ],
                "testParallelConvergingGateway: state after Start Event2"
            );

            //setTimeout(function() {done(data);}, 2000);
            done(data);
        },
        "Parallel Converging Gateway": function(data, done) {
            log("Exclusive Converging Gateway");
            done(data);
        },
        "End Event": function(data, done) {
            log("End Event");
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "End Event"
                    }
                ],
                "testParallelConvergingGateway: at End Event"
            );

            var history = this.getHistory();
            test.deepEqual(history,
                [
                    "Start Event1",
                    "Parallel Converging Gateway",
                    "Start Event2",
                    "Parallel Converging Gateway",
                    "End Event"
                ],
                "testParallelConvergingGateway: history at End Event"
            );

            done(data);
            testOk(this);
        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstConvergingParallelGatewayProcess", processDefinition, handler);

    bpmnProcess.emitEvent("Start Event1");
    bpmnProcess.emitEvent("Start Event2");

};
