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

exports.testDivergingParallelGatewayProcess = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcessWithParallelGateway");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "Start Event", "startEvent", [], ["_4"]));
    processDefinition.addGateway(new BPMNParallelGateway("_3", "Parallel Gateway", "parallelGateway", ["_4"], ["_7","_8"]));
    processDefinition.addTask(new BPMNTask("_5", "Task A", "task", ["_7"], []));
    processDefinition.addTask(new BPMNTask("_6", "Task B", "task", ["_8"], []));
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
                    "position": "Task A"
                },
                {
                    "position": "Task B"
                }
            ],
            "testDivergingParallelGatewayProcess: state after forking A and B"
        );

        var history = process.getHistory();
        test.deepEqual(history,
            [
                "Start Event",
                "Parallel Gateway",
                "Task A",
                "Task B"
            ],
            "testDivergingParallelGatewayProcess: history after forking A and B"
        );

        test.done();
    };

    var log = function(eventType) {
        //console.log("testDivergingParallelGatewayProcess: Calling handler for '" + eventType + "'");
    };

    var handler = {
        "Start Event": function(data, done) {
            log("Start Event");
            done(data);
        },
        "Task A": function(data, done) {
            log("Task A");
            if (--counter === 0) testOk(this);
            done(data);
        },
        "Task B": function(data, done) {
            log("Task B");
            done(data);
            if (--counter === 0) testOk(this);
        },
        "Parallel Gateway": function(data, done) {
            log("Parallel Gateway");
            done(data);
        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstForkingGatewayProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("Start Event");
};