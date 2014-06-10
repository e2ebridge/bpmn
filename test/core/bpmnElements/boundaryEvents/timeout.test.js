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

exports.testBPMNTimeout = function(test) {
    var bpmnProcess;

    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3");
    boundaryEvent.isTimerEvent = true;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));

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
                "testBPMNTimeout: state at MyStart"
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
                "testBPMNTimeout: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);
        },
        "MyTimeout$getTimeout": function() {
            test.ok(true, "testBPMNTimeout: getTimeout has been called");
            return 1000.11;
        },
        "MyTimeout": function(data, done) {
            var hasTimeouts = bpmnProcess.pendingTimerEvents.hasTimeouts();
            test.ok(!hasTimeouts,
                "testClearBPMNTimeoutByLeavingTask: there should be no more pending timeouts"
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
                        "name": "MyTimeout",
                        "type": "boundaryEvent",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "testBPMNTimeout: history at MyTimeout BEFORE done()"
            );

            done(data);

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
                        "name": "MyTimeout",
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
                "testBPMNTimeout: history at MyTimeout AFTER done()"
            );
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
                "testBPMNTimeout: state at MyEnd"
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
                        "name": "MyTimeout",
                        "type": "boundaryEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyEnd",
                        "type": "endEvent",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "testBPMNTimeout: history at MyEnd"
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

exports.testBPMNWrongGetTimeoutResponse = function(test) {
    var logMessages = [];

    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3");
    boundaryEvent.isTimerEvent = true;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));

    var timeout = "1000x";

    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MyTask": function(data, done) {
            done(data);
        },
        "MyTimeout$getTimeout": function() {
            test.ok(true, "testBPMNWrongGetTimeoutResponse: getTimeout has been called");
            return timeout;
        },
        "MyTimeout": function(data, done) {
            test.ok(false, "testBPMNWrongGetTimeoutResponse: shouldn't get here");
            done(data);
        },
        "MyEnd": function(data, done) {
            test.ok(false, "testBPMNWrongGetTimeoutResponse: shouldn't get here");
            done(data);
        },
        "defaultErrorHandler": function(error) {
            test.ok(true, "testBPMNWrongGetTimeoutResponse: called default error handler");

            test.equal(error.message,
                "The getTimeout handler 'MyTimeout$getTimeout' does not return a number but '1000x'",
                "testBPMNWrongGetTimeoutResponse: test error message.");

            test.deepEqual(logMessages,
                [
                    "[error][myProcess][myFirstProcess][Error in handler 'MyTask': Error: The getTimeout handler 'MyTimeout$getTimeout' does not return a number but '1000x']"
                ],
                "testBPMNWrongGetTimeoutResponse: test log messages.");
            test.done();
        }
    };

    bpmnProcesses.createBPMNProcess("myFirstProcess", processDefinition, handler, function(err, bpmnProcess){


        var logAppender = function(logMessage) {
            logMessages.push(logMessage);
        };
        bpmnProcess.setLogAppender(logAppender);

        bpmnProcess.triggerEvent("MyStart");
    });

};