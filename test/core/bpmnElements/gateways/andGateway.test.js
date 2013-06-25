/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../../lib/process.js');
var Persistency = require('../../../../lib/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNParallelGateway = require("../../../../lib/parsing/gateways.js").BPMNParallelGateway;

require("../../../../lib/history.js").setDummyTimestampFunction();

exports.testDivergingParallelGatewayProcess = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcessWithParallelGateway");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNParallelGateway("_3", "Parallel Gateway", "parallelGateway"));
    processDefinition.addFlowObject(new BPMNTask("_5", "Task A", "task"));
    processDefinition.addFlowObject(new BPMNTask("_6", "Task B", "task"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_7", null, "sequenceFlow", "_3", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_3", "_6"));

    var counter = 2;

    var testOk = function(process) {
        test.ok(true, "testDivergingParallelGatewayProcess: reached Task A and B");

        var states = process.getState();
        test.deepEqual(states.tokens,
            [
                {
                    "position": "Task A",
                    "owningProcessId": "myFirstForkingGatewayProcess"
                },
                {
                    "position": "Task B",
                    "owningProcessId": "myFirstForkingGatewayProcess"
                }
            ],
            "testDivergingParallelGatewayProcess: state after forking A and B"
        );

        var history = process.getHistory();
        test.deepEqual(history.historyEntries,
            [
                {
                    "name": "Start Event",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "Parallel Gateway",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "Task A",
                    "begin": "_dummy_ts_",
                    "end": null // set after done()
                },
                {
                    "name": "Task B",
                    "begin": "_dummy_ts_",
                    "end": null // set after done()
                }
            ],
            "testDivergingParallelGatewayProcess: history after forking A and B"
        );

        test.done();
    };

    var log = function(eventType) {
        //console.log("testDivergingParallelGatewayProcess: Calling handler for '" + eventType + "'");
    };

    var handler = {
        "Start_Event": function(data, done) {
            log("Start Event");
            done(data);
        },
        "Task_A": function(data, done) {
            log("Task A");
            if (--counter === 0) testOk(this);
            done(data);
        },
        "Task_B": function(data, done) {
            log("Task B");
            if (--counter === 0) testOk(this);
            done(data);
        },
        "Parallel_Gateway": function(data, done) {
            log("Parallel Gateway");
            done(data);
        }
    };

    var bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstForkingGatewayProcess", processDefinition, handler);

    bpmnProcess.triggerEvent("Start Event");
};