/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var error = require("../../../../lib/parsing/errors.js");

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../../lib/parsing/gateways.js").BPMNExclusiveGateway;

exports.testXorGatewayValidateOK = function(test) {
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
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_15", null, "sequenceFlow", "_9", "_12"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [],
        "testXorGatewayValidateOK");
    test.done();
};

exports.testXorGatewayValidateGW1 = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "First Task", "task"));
    processDefinition.addFlowObject(new BPMNTask("_7", "Task A", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_11", "End Event A", "endEvent"));
    processDefinition.addFlowObject(new BPMNExclusiveGateway("_5", "Is it ok?", "exclusiveGateway"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", "nok", "sequenceFlow", "_5", "_7"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_14", null, "sequenceFlow", "_7", "_11"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "GW1",
                "description": "The exclusiveGateway 'Is it ok?' must have more than one incoming or outgoing flow to work as gateway.",
                "bpmnId": "_5",
                "bpmnName": "Is it ok?",
                "bpmnType": "exclusiveGateway"
            }
        ],
        "testXorGatewayValidateGW1");
    test.done();
};

exports.testXorGatewayValidateXG1 = function(test) {
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
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", "", "sequenceFlow", "_5", "_7"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", "", "sequenceFlow", "_5", "_9"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_14", null, "sequenceFlow", "_7", "_11"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_15", null, "sequenceFlow", "_9", "_12"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "XG1",
                "description": "Outgoing flows of the exclusiveGateway 'Is it ok?' must have names.",
                "bpmnId": "_8",
                "bpmnName": "",
                "bpmnType": "sequenceFlow"
            },
            {
                "code": "XG1",
                "description": "Outgoing flows of the exclusiveGateway 'Is it ok?' must have names.",
                "bpmnId": "_10",
                "bpmnName": "",
                "bpmnType": "sequenceFlow"
            }
        ],
        "testXorGatewayValidateXG1");
    test.done();
};