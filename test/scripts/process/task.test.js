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
var BPMNExclusiveGateway = require("../../../lib/bpmn/gateways.js").BPMNExclusiveGateway;


function getMockupProcessDefinition() {

    /** @type {BPMNProcessDefinition} */
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "MyStart", "startEvent", [], ["_4"]));
    processDefinition.addTask(new BPMNTask("_3", "MyTask", "task", ["_4"], ["_6"]));
    processDefinition.addEndEvent(new BPMNEndEvent("_5", "MyEnd", "endEvent", ["_6"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    return processDefinition;
}

exports.testSimpleBPMNProcess = function(test) {
    var state;
    var processDefinition = getMockupProcessDefinition();

    var handler = {
        "MyStart": function(data, done) {
            //console.log("Calling handler for 'MyStart'");
            done(data);
        },
        "MyTask": function(data, done) {
            //console.log("Calling handler for 'MyTask'");
            done(data);
        },
        "MyTaskDone": function(data, done) {
            //console.log("Calling handler for 'MyTaskDone'");
            done(data);
        },
        "MyEnd": function(data, done) {
            //console.log("Calling handler for 'MyEnd'");
            done(data);
        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstProcess", processDefinition, handler);

    bpmnProcess.emitEvent("MyStart");

    process.nextTick(function() {
        //console.log("Comparing result after start event");
        state = bpmnProcess.getState();
        test.deepEqual(state,
            [
                {
                    "bpmnId": "_3",
                    "name": "MyTask",
                    "type": "task",
                    "outgoingRefs": [
                        "_6"
                    ],
                    "incomingRefs": [
                        "_4"
                    ],
                    "waitForTaskDoneEvent": true
                }
            ],
            "testSimpleBPMNProcess: initial task"
        );
    });

    process.nextTick(function() {
        //console.log("Sending task done");
        bpmnProcess.taskDone("MyTask");
    });

    process.nextTick(function() {

        //console.log("Checking for end event");
        state = bpmnProcess.getState();
        test.deepEqual(state,
            [
                {
                    "bpmnId": "_5",
                    "name": "MyEnd",
                    "type": "endEvent",
                    "outgoingRefs": [],
                    "incomingRefs": [
                        "_6"
                    ]
                }
            ],
            "testSimpleBPMNProcess: end event"
        );
    });

    process.nextTick(function() {
        //console.log("Test Done");
        test.done();
    });
};