/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../../lib/process.js');

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNParallelGateway = require("../../../../lib/parsing/gateways.js").BPMNParallelGateway;

require("../../../../lib/history.js").setDummyTimestampFunction();

exports.testAndMerge = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event1", "startEvent"));
    processDefinition.addFlowObject(new BPMNStartEvent("_3", "Start Event2", "startEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_9", "End Event", "endEvent"));
    processDefinition.addFlowObject(new BPMNParallelGateway("_4", "Parallel Converging Gateway", "parallelGateway"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_4", "_9"));

    var log = function() {};

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
                        "owningProcessId": "myFirstConvergingParallelGatewayProcess"
                    },
                    {
                        "position": "Start Event2",
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
                        "owningProcessId": "myFirstConvergingParallelGatewayProcess"
                    }
                ],
                "testAndMerge: at End Event"
            );

            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "Start Event1",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "Parallel Converging Gateway",
                        "type": "parallelGateway",
                        "begin": "_dummy_ts_",
                        "end": null // is set only after both tokens arrived - see next "Parallel Converging Gateway" entry
                    },
                    {
                        "name": "Start Event2",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "Parallel Converging Gateway",
                        "type": "parallelGateway",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "End Event",
                        "type": "endEvent",
                        "begin": "_dummy_ts_",
                        "end": null // set after done()
                    }]                ,
                "testAndMerge: history at End Event"
            );

            done(data);
            testOk(this);
        }
    };

    bpmnProcesses.createBPMNProcess("myFirstConvergingParallelGatewayProcess", processDefinition, handler, function(err, bpmnProcess){

        bpmnProcess.triggerEvent("Start Event1");
        bpmnProcess.triggerEvent("Start Event2");

    });

};
