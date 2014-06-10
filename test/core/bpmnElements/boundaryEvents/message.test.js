/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../../lib/process.js');
var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNBoundaryEvent = require("../../../../lib/parsing/boundaryEvents.js").BPMNBoundaryEvent;

require("../../../../lib/history.js").setDummyTimestampFunction();

exports.testBPMNMessageBoundaryEvent = function(test) {
    var bpmnProcess, boundaryEvent, myTask, processDefinition, handler;

    boundaryEvent = new BPMNBoundaryEvent("_7", "MyMessageBoundaryEvent", "boundaryEvent", "_3");
    boundaryEvent.isMessageEvent = true;

    myTask = new BPMNTask("_3", "MyTask", "task");

    /** @type {BPMNProcessDefinition} */
    processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(myTask);
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));

    handler = {
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
                "testBPMNMessageBoundaryEvent: state at MyMessageBoundaryEvent"
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
                        "name": "MyTask",
                        "type": "task",
                        "begin": "_dummy_ts_",
                        "end": null
                    },
                    {
                        "name": "MyMessageBoundaryEvent",
                        "type": "boundaryEvent",
                        "begin": "_dummy_ts_",
                        "end": null
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

            // to set the end time stamp in the history, we have to call done() BEFORE comparing the history entries
            done(data);

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
                        "name": "MyTask",
                        "type": "task",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyMessageBoundaryEvent",
                        "type": "boundaryEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyEnd",
                        "type": "endEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    }
                ],
                "testBPMNMessageBoundaryEvent: history at MyEnd"
            );

            test.done();
        }
    };

    bpmnProcess = bpmnProcesses.createBPMNProcess("myFirstProcess", processDefinition, handler, function(err, process){
        bpmnProcess = process;

        bpmnProcess.triggerEvent("MyStart");
    });


};
