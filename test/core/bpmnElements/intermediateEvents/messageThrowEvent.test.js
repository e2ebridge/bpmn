/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../../lib/process.js');

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNIntermediateThrowEvent = require("../../../../lib/parsing/intermediateEvents.js").BPMNIntermediateThrowEvent;

require("../../../../lib/history.js").setDummyTimestampFunction();

exports.testIntermediateThrowEvent = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNIntermediateThrowEvent("_3", "Intermediate Message Event", "intermediateThrowEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyStart",
                        "owningProcessId": "myIntermediateThrowEventProcess"
                    }
                ],
                "testIntermediateThrowEvent: state at MyStart"
            );
            done(data);
        },
        "Intermediate_Message_Event": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "Intermediate Message Event",
                        "owningProcessId": "myIntermediateThrowEventProcess"
                    }
                ],
                "testIntermediateThrowEvent: state at Intermediate Message Event"
            );
            this.data = {myproperty: "blah"};
            done(data);
        },
        "MyEnd": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyEnd",
                        "owningProcessId": "myIntermediateThrowEventProcess"
                    }
                ],
                "testIntermediateThrowEvent: state at MyEnd"
            );
            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "Intermediate Message Event",
                        "type": "intermediateThrowEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyEnd",
                        "type": "endEvent",
                        "begin": "_dummy_ts_",
                        "end": null // set in done()
                    }
                ],
                "testIntermediateThrowEvent: history at MyEnd"
            );
            done(data);

            test.done();
        }
    };

    bpmnProcesses.createBPMNProcess("myIntermediateThrowEventProcess", processDefinition, handler, function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart");
    });

};