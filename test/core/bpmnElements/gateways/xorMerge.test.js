/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../../lib/process.js');

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../../lib/parsing/gateways.js").BPMNExclusiveGateway;

require("../../../../lib/history.js").setDummyTimestampFunction();

exports.testXorMerge = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event1", "startEvent"));
    processDefinition.addFlowObject(new BPMNStartEvent("_3", "Start Event2", "startEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_9", "End Event", "endEvent"));
    processDefinition.addFlowObject(new BPMNExclusiveGateway("_4", "Exclusive Converging Gateway", "exclusiveGateway"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_4", "_9"));

    var log = function() {};

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
            test.ok(true, "testXorMerge: reached End_Event");

            var history = this.getHistory();

            if (finalTest) {
                test.deepEqual(history.historyEntries,
                    [
                        {
                            "name": "Start Event2",
                            "type": "startEvent",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "Exclusive Converging Gateway",
                            "type": "exclusiveGateway",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "End Event",
                            "type": "endEvent",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        }
                    ],
                    "testXorMerge: history at End Event"
                );

                test.done();
            } else {
                test.deepEqual(history.historyEntries,
                    [
                        {
                            "name": "Start Event1",
                            "type": "startEvent",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "Exclusive Converging Gateway",
                            "type": "exclusiveGateway",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "End Event",
                            "type": "endEvent",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        }
                    ],
                    "testXorMerge: history at End Event"
                );
            }

        }
    };

    bpmnProcesses.createBPMNProcess("myFirstConvergingXorGatewayProcess", processDefinition, handler, function(err, bpmnProcess){

        bpmnProcess.triggerEvent("Start Event1");

    });

    bpmnProcesses.createBPMNProcess("myFirstConvergingXorGatewayProcess2", processDefinition, handler, function(err, bpmnProcess2){

        finalTest = true;

        bpmnProcess2.triggerEvent("Start Event2");

    });

};