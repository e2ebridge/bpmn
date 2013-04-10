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
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "Start Event", "startEvent", [], ["_4"]));
    processDefinition.addTask(new BPMNTask("_3", "First Task", "task", ["_4"], ["_6"]));
    processDefinition.addTask(new BPMNTask("_7", "Task A", "task", ["_8"], ["_14"]));
    processDefinition.addTask(new BPMNTask("_9", "Task B", "task", ["_10"], ["_13"]));
    processDefinition.addEndEvent(new BPMNEndEvent("_11", "End Event A", "endEvent", ["_14"], []));
    processDefinition.addEndEvent(new BPMNEndEvent("_12", "End Event B", "endEvent", ["_13"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", "nok", "sequenceFlow", "_5", "_7"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", "ok", "sequenceFlow", "_5", "_9"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_14", null, "sequenceFlow", "_7", "_11"));
    processDefinition.addGateway(new BPMNExclusiveGateway("_5", "Is it ok?", "exclusiveGateway", ["_6"], ["_8","_10"]));

    return processDefinition;
}

exports.testExclusiveGatewayProcess = function(test) {
    var processDefinition = getMockupProcessDefinition();

    var handler = {
        "Start Event": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'Start Event'");
            done(data);
        },
        "First Task": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'First Task'");
            done(data);
        },
        "First TaskDone": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'First TaskDone'");
            done(data);
        },
        "Is it ok?": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'Is it ok?'");
            done(data);
        },
        "Is it ok?:ok": function() {
            console.log("testExclusiveGatewayProcess: Calling handler for 'Is it ok?:ok'");
            return true;
        },
        "Is it ok?:nok": function() {
            console.log("testExclusiveGatewayProcess: Calling handler for 'Is it ok?:nok'");
            return false;
        },
        "Task A": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'Task A'");
            test.ok(false, "testExclusiveGatewayProcess: reached Task A but expected B!");
            test.done();
            done(data);
        },
        "Task ADone": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'Task ADone'");
            done(data);
        },
        "Task B": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'Task B'");
            test.ok(true, "testExclusiveGatewayProcess: reached Task B");
            test.done();
            done(data);
        },
        "Task BDone": function(data, done) {
            console.log("testExclusiveGatewayProcess. Calling handler for 'Task BDone'");
            done(data);
        },
        "End Event A": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'End Event A'");
            done(data);
        },
        "End Event B": function(data, done) {
            console.log("testExclusiveGatewayProcess: Calling handler for 'End Event B'");
            done(data);
        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstXGatewayProcess", processDefinition, handler);

    bpmnProcess.emitEvent("Start Event");
    bpmnProcess.taskDone("First Task");

};