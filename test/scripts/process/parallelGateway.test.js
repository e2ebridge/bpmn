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

exports.testParallelConvergingGateway = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "Start Event1", "startEvent", [], ["_5"]));
    processDefinition.addStartEvent(new BPMNStartEvent("_3", "Start Event2", "startEvent", [], ["_6"]));
    processDefinition.addEndEvent(new BPMNEndEvent("_9", "End Event", "endEvent", ["_10"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_4", "_9"));
    processDefinition.addGateway(new BPMNParallelGateway("_4", "Parallel Converging Gateway", "exclusiveGateway", ["_5", "_6"], ["_10"]));

    var log = function(eventType) {
        console.log("testParallelConvergingGateway: Calling handler for '" + eventType + "'");
    };

    var counter = 0;
    var testOk = function(process) {
        test.equal(counter, 2, "testParallelConvergingGateway: reached end event after start event1 AND start event2");

        var states = process.getState();
        test.deepEqual(states,
            [
                {
                    "bpmnId": "_9",
                    "name": "End Event",
                    "type": "endEvent",
                    "incomingRefs": [
                        "_10"
                    ],
                    "outgoingRefs": []
                }
            ],
            "testDivergingParallelGatewayProcess: state after merging start event1 and start event2")
        ;
        test.done();
    };
    var handler = {
        "Start Event1": function(data, done) {
            log("Start Event1");
            counter++;
            done(data);
        },
        "Start Event2": function(data, done) {
            log("Start Event2");
            counter++;
            done(data);
        },
        "Parallel Converging Gateway": function(data, done) {
            log("Exclusive Converging Gateway");
            done(data);
        },
        "End Event": function(data, done) {
            log("End Event");
            done(data);
            testOk(this);
        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstConvergingParallelGatewayProcess", processDefinition, handler);

    bpmnProcess.emitEvent("Start Event1");
    bpmnProcess.emitEvent("Start Event2");

};

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
        test.deepEqual(states,
            [
                {
                    "bpmnId": "_5",
                    "name": "Task A",
                    "type": "task",
                    "incomingRefs": [
                        "_7"
                    ],
                    "outgoingRefs": [],
                    "waitForTaskDoneEvent": true
                },
                {
                    "bpmnId": "_6",
                    "name": "Task B",
                    "type": "task",
                    "incomingRefs": [
                        "_8"
                    ],
                    "outgoingRefs": [],
                    "waitForTaskDoneEvent": true
                }
            ],
            "testDivergingParallelGatewayProcess: state after forking A and B")
        ;
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
        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstForkingGatewayProcess", processDefinition, handler);

    bpmnProcess.emitEvent("Start Event");

    test.expect(1);
};