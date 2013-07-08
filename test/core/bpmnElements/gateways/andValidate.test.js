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
var BPMNParallelGateway = require("../../../../lib/parsing/gateways.js").BPMNParallelGateway;

exports.testParallelGatewayValidateOK = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcessWithParallelGateway");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNParallelGateway("_3", "Parallel Gateway", "parallelGateway"));
    processDefinition.addFlowObject(new BPMNTask("_5", "Task A", "task"));
    processDefinition.addFlowObject(new BPMNTask("_6", "Task B", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_9", "End Event", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_7", null, "sequenceFlow", "_3", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_3", "_6"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_5", "_9"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_11", null, "sequenceFlow", "_6", "_9"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [],
        "testParallelGatewayValidateOK");
    test.done();
};

exports.testParallelGatewayValidateGW1 = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcessWithParallelGateway");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNParallelGateway("_3", "Parallel Gateway", "parallelGateway"));
    processDefinition.addFlowObject(new BPMNTask("_5", "Task A", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_9", "End Event", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_7", null, "sequenceFlow", "_3", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", null, "sequenceFlow", "_5", "_9"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "GW1",
                "description": "The parallelGateway 'Parallel Gateway' must have more than one incoming or outgoing flow to work as gateway.",
                "bpmnId": "_3",
                "bpmnName": "Parallel Gateway",
                "bpmnType": "parallelGateway"
            }
        ],
        "testParallelGatewayValidateGW1");
    test.done();
};