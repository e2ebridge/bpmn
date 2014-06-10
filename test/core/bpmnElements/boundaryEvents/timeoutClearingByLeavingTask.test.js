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

exports.testClearBPMNTimeoutByLeavingTask = function(test) {
    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3");
    boundaryEvent.isTimerEvent = true;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addFlowObject(new BPMNEndEvent("_9", "MyEnd2", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_3", "_9"));

    var bpmnProcess;

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyStart",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: state at MyStart"
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
                "testClearBPMNTimeoutByLeavingTask: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);
        },
        "MyTaskDone": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);
        },
        "MyTimeout$getTimeout": function() {
            test.ok(true, "testClearBPMNTimeoutByLeavingTask: getTimeout has been called");

            var maxTimeout = 360 * 24 * 3600 * 1000;
            process.nextTick(function() {
                var myTimeout = bpmnProcess.pendingTimerEvents.getTimeout("MyTimeout");
                var myTimeoutValue = myTimeout ? myTimeout.timeout : -1;
                test.equal(myTimeoutValue,
                    maxTimeout,
                    "testClearBPMNTimeoutByLeavingTask: maxTimeout"
                );
                bpmnProcess.taskDone("MyTask");
            });
            return maxTimeout;
        },
        "MyTimeout": function(data, done) {
            test.ok(false, "testClearBPMNTimeoutByLeavingTask: should never be here");
            done(data);
        },
        "MyEnd2": function(data, done) {

            var hasTimeouts = bpmnProcess.pendingTimerEvents.hasTimeouts();
            test.ok(!hasTimeouts,
                "testClearBPMNTimeoutByLeavingTask: active timers should be empty"
            );
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyEnd2",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: state at MyEnd"
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
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyEnd2",
                        "type": "endEvent",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "testClearBPMNTimeoutByLeavingTask: history at MyEnd"
            );
            done(data);

            test.done();
        }
    };

    bpmnProcesses.createBPMNProcess("myFirstProcess", processDefinition, handler, function(err, process){
        bpmnProcess = process;

        bpmnProcess.triggerEvent("MyStart");
    });

};
