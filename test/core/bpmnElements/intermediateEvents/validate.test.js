/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var error = require("../../../../lib/parsing/errors.js");

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNIntermediateCatchEvent = require("../../../../lib/parsing/intermediateEvents.js").BPMNIntermediateCatchEvent;

exports.testIntermediateEventValidationOK = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myIntermediateCatchEventTestProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNIntermediateCatchEvent("_3", "My Intermediate Catch Event", "intermediateCatchEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "End Event", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [],
        "testIntermediateEventValidationOK");
    test.done();

};

exports.testIntermediateEventValidationFO3FO5 = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myIntermediateCatchEventTestProcess");
    processDefinition.addFlowObject(new BPMNIntermediateCatchEvent("_3", "My Intermediate Catch Event", "intermediateCatchEvent"));

    var errorQueue = error.createBPMNParseErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "FO5",
                "description": "The intermediateCatchEvent 'My Intermediate Catch Event' must have at least one incoming sequence flow.",
                "bpmnId": "_3",
                "bpmnName": "My Intermediate Catch Event",
                "bpmnType": "intermediateCatchEvent"
            },
            {
                "code": "FO3",
                "description": "The intermediateCatchEvent 'My Intermediate Catch Event' must have exactly one outgoing sequence flow.",
                "bpmnId": "_3",
                "bpmnName": "My Intermediate Catch Event",
                "bpmnType": "intermediateCatchEvent"
            }
        ],
        "testIntermediateEventValidationFO3FO5");
    test.done();

};