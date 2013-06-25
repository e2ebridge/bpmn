/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../../lib/process.js');
var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNIntermediateCatchEvent = require("../../../../lib/parsing/intermediateEvents.js").BPMNIntermediateCatchEvent;

require("../../../../lib/history.js").setDummyTimestampFunction();

exports.testBPMNCatchTimerEvent = function(test) {
    var bpmnProcess;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));

    var catchTimerEventElement = new BPMNIntermediateCatchEvent("_3", "MyCatchTimerEvent", "intermediateCatchEvent");
    catchTimerEventElement.isTimerEvent = true;
    processDefinition.addFlowObject(catchTimerEventElement);

    processDefinition.addFlowObject(new BPMNEndEvent("_4", "MyEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));

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
                "testBPMNCatchTimerEvent: state at MyStart"
            );
            done(data);
        },
       "MyCatchTimerEvent$getTimeout": function() {
            test.ok(true, "testBPMNCatchTimerEvent: getTimeout has been called");
            return 1000;
        },
        "MyCatchTimerEvent": function(data, done) {
            var hasTimeouts = bpmnProcess.pendingTimerEvents.hasTimeouts();
            test.ok(!hasTimeouts,
                "testClearBPMNTimeoutByLeavingTask: there should be no more pending timeouts"
            );

            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "MyStart",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyCatchTimerEvent",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "testBPMNCatchTimerEvent: history at MyCatchTimerEvent"
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
                "testBPMNCatchTimerEvent: state at MyEnd"
            );
            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "MyStart",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyCatchTimerEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyEnd",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "testBPMNCatchTimerEvent: history at MyEnd"
            );
            done(data);

            test.done();
        }
    };

    bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstProcess", processDefinition, handler);

    bpmnProcess.triggerEvent("MyStart");

};
