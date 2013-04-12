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

exports.testExclusiveConvergingGateway = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "Start Event1", "startEvent", [], ["_5"]));
    processDefinition.addStartEvent(new BPMNStartEvent("_3", "Start Event2", "startEvent", [], ["_6"]));
    processDefinition.addEndEvent(new BPMNEndEvent("_9", "End Event", "endEvent", ["_10"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_4", "_9"));
    processDefinition.addGateway(new BPMNExclusiveGateway("_4", "Exclusive Converging Gateway", "exclusiveGateway", ["_5", "_6"], ["_10"]));

    var log = function(eventType) {
        //console.log("testExclusiveConvergingGateway: Calling handler for '" + eventType + "'");
    };

    var finalTest = false;

    var handler = {
        "Start Event1": function(data, done) {
            log("Start Event1");
            done(data);
        },
        "Start Event2": function(data, done) {
            log("Start Event2");
            done(data);
        },
        "Exclusive Converging Gateway": function(data, done) {
            log("Exclusive Converging Gateway");
            done(data);
        },
        "End Event": function(data, done) {
            log("End Event");
            done(data);
            test.ok(true, "testExclusiveConvergingGateway: reached end event");
            if (finalTest)  test.done();
        }
    };

    var bpmnProcess = new BPMNProcessEngine("myFirstConvergingXorGatewayProcess", processDefinition, handler);

    bpmnProcess.emitEvent("Start Event1");

    var bpmnProcess2 = new BPMNProcessEngine("myFirstConvergingXorGatewayProcess2", processDefinition, handler);

    finalTest = true;

    bpmnProcess2.emitEvent("Start Event2");

};

exports.testExclusiveDivergingGateway = function(test) {
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

    var bpmnProcess = new BPMNProcessEngine("myFirstXGatewayProcess", processDefinition, handler);

    bpmnProcess.emitEvent("Start Event");
    bpmnProcess.taskDone("First Task");

};