/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../lib/execution/process.js');
var Persistency = require('../../../lib/execution/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../lib/bpmn/gateways.js").BPMNExclusiveGateway;

exports.testExclusiveDivergingGateway = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "First Task", "task"));
    processDefinition.addFlowObject(new BPMNTask("_7", "Task A", "task"));
    processDefinition.addFlowObject(new BPMNTask("_9", "Task B", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_11", "End Event A", "endEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_12", "End Event B", "endEvent"));
    processDefinition.addFlowObject(new BPMNExclusiveGateway("_5", "Is it ok?", "exclusiveGateway"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", "nok", "sequenceFlow", "_5", "_7"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", "ok", "sequenceFlow", "_5", "_9"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_14", null, "sequenceFlow", "_7", "_11"));

    var log = function(eventType) {
        //console.log("testExclusiveDivergingGateway: Calling handler for '" + eventType + "'");
    };

    var handler = {
        "Start Event": function(data, done) {
            log("Start Event");
            done(data);
        },
        "First Task": function(data, done) {
            log("First Task");
            done(data);
        },
        "First TaskDone": function(data, done) {
            log("First TaskDone");
            done(data);
        },
        "Is it ok?": function(data, done) {
            log("Is it ok?");
            done(data);
        },
        "Is it ok?:ok": function() {
            log("Is it ok?:ok");
            return true;
        },
        "Is it ok?:nok": function() {
            log("Is it ok?:nok");
            return false;
        },
        "Task A": function(data, done) {
            log("Task A");
            test.ok(false, "testExclusiveDivergingGateway: reached Task A but expected B!");
            test.done();
            done(data);
        },
        "Task ADone": function(data, done) {
            log("Task ADone");
            done(data);
        },
        "Task B": function(data, done) {
            log("Task B");

            test.ok(true, "testExclusiveDivergingGateway: reached Task B");

            var history = this.getHistory();
            test.deepEqual(history,
                [
                    "Start Event",
                    "First Task",
                    "Is it ok?",
                    "Task B"
                ],
                "testExclusiveDivergingGateway: history at End Event B"
            );

            test.done();

            done(data);
        },
        "Task BDone": function(data, done) {
            log("Task BDone");
            done(data);
        },
        "End Event A": function(data, done) {
            log("End Event A");
            done(data);
        },
        "End Event B": function(data, done) {
            log("End Event B");
            done(data);
        }
    };

    var bpmnProcess = bpmnProcessModule.createBPMNProcess("myFirstXGatewayProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("Start Event");
    bpmnProcess.taskDone("First Task");

};