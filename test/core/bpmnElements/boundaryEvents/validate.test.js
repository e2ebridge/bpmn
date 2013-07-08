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
var BPMNBoundaryEvent = require("../../../../lib/parsing/boundaryEvents.js").BPMNBoundaryEvent;

exports.testBPMNMessageBoundaryEventValidateOK = function(test) {

    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyMessageBoundaryEvent", "boundaryEvent", "_3");
    boundaryEvent.isMessageEvent = true;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_9", null, "sequenceFlow", "_3", "_5"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [],
        "testBPMNMessageBoundaryEventValidateOK");
    test.done();
};

exports.testBPMNMessageBoundaryEventValidateFO3FO5 = function(test) {

    var boundaryEvent = new BPMNBoundaryEvent("_7", "MyMessageBoundaryEvent", "boundaryEvent", "_3");
    boundaryEvent.isMessageEvent = true;

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(boundaryEvent);
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_3", "_7"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_9", null, "sequenceFlow", "_3", "_5"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "FO5",
                "description": "The boundaryEvent 'MyMessageBoundaryEvent' must not have incoming sequence flows.",
                "bpmnId": "_7",
                "bpmnName": "MyMessageBoundaryEvent",
                "bpmnType": "boundaryEvent"
            },
            {
                "code": "FO3",
                "description": "The boundaryEvent 'MyMessageBoundaryEvent' must have exactly one outgoing sequence flow.",
                "bpmnId": "_7",
                "bpmnName": "MyMessageBoundaryEvent",
                "bpmnType": "boundaryEvent"
            }
        ],
        "testBPMNMessageBoundaryEventValidateFO3FO5");
    test.done();
};
