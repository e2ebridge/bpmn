/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var error = require("../../../../lib/parsing/errors.js");

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

exports.testValidateBPMNStartEventFO3 = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "FO3",
                "description": "The startEvent 'MyStart' must have exactly one outgoing sequence flow.",
                "bpmnId": "_2",
                "bpmnName": "MyStart",
                "bpmnType": "startEvent"
            }
        ],
        "testValidateBPMNStartEventFO3");
    test.done();

};

exports.testValidateBPMNStartEventFO5 = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_2"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "FO5",
                "description": "The startEvent 'MyStart' must not have incoming sequence flows.",
                "bpmnId": "_2",
                "bpmnName": "MyStart",
                "bpmnType": "startEvent"
            }
        ],
        "testValidateBPMNStartEventFO5");
    test.done();

};

