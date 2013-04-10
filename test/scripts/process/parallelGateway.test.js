/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNProcessEngine = require('../../../lib/process.js').BPMNProcess;
var Persistency = require('../../../lib/persistency.js').Persistency;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNParallelGateway = require("../../../lib/bpmn/gateways.js").BPMNParallelGateway;

function getMockupForkingGatewayProcessDefinition() {

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcessWithParallelGateway");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "Start Event", "startEvent", [], ["_4"]));
    processDefinition.addGateway(new BPMNParallelGateway("_3", "Parallel Gateway", "parallelGateway", ["_4"], ["_7","_8"]));
    processDefinition.addTask(new BPMNTask("_5", "Task A", "task", ["_7"], []));
    processDefinition.addTask(new BPMNTask("_6", "Task B", "task", ["_8"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_7", null, "sequenceFlow", "_3", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_3", "_6"));

    return processDefinition;
}

exports.testForkingParallelGatewayProcess = function(test) {
    var processDefinition = getMockupForkingGatewayProcessDefinition();

    var counter = 2;

    var testOk = function(process) {
        test.ok(true, "testExclusiveGatewayProcess: reached Task A and B");

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
            "testForkingParallelGatewayProcess: state after forking A and B")
        ;
        test.done();
    };

    var handler = {
        "Start Event": function(data, done) {
            console.log("Calling handler for 'Start Event'");
            done(data);
        },
        "Task A": function(data, done) {
            console.log("Calling handler for 'Task A'");
            if (--counter === 0) testOk(this);
            done(data);
        },
        "Task B": function(data, done) {
            console.log("Calling handler for 'Task B'");
            done(data);
            if (--counter === 0) testOk(this);
        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstForkingGatewayProcess", processDefinition, handler);

    bpmnProcess.emitEvent("Start Event");

    test.expect(1);
};