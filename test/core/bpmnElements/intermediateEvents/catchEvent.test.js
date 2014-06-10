/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../../lib/process.js');

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNIntermediateCatchEvent = require("../../../../lib/parsing/intermediateEvents.js").BPMNIntermediateCatchEvent;

require("../../../../lib/history.js").setDummyTimestampFunction();

exports.testIntermediateCatchEvent = function(test) {
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
                        "owningProcessId": "myIntermediateCatchEventTestProcess"
                    }
                ],
                "testIntermediateCatchEvent: state at Start Event"
            );
            done(data);
        },
        "My_Intermediate_Catch_Event": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "My Intermediate Catch Event",
                        "owningProcessId": "myIntermediateCatchEventTestProcess"
                    }
                ],
                "testIntermediateCatchEvent: state at My Intermediate Catch Event"
            );
            done(data);
        },
        "End_Event": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "End Event",
                        "owningProcessId": "myIntermediateCatchEventTestProcess"
                    }
                ],
                "testIntermediateCatchEvent: state at End Event"
            );
            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "Start Event",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "My Intermediate Catch Event",
                        "type": "intermediateCatchEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "End Event",
                        "type": "endEvent",
                        "begin": "_dummy_ts_",
                        "end": null // set after done()
                    }
                ],
                "testIntermediateCatchEvent: history at End Event"
            );
            done(data);

            test.done();
        }
    };

    bpmnProcesses.createBPMNProcess("myIntermediateCatchEventTestProcess", processDefinition, handler, function(err, bpmnProcess){

        bpmnProcess.triggerEvent("Start Event");

        process.nextTick(function() {
            bpmnProcess.triggerEvent("My Intermediate Catch Event");
        });

    });

};