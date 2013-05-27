/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNIntermediateCatchEvent = require("../../../lib/bpmn/intermediateEvents.js").BPMNIntermediateCatchEvent;
var errorQueueModule = require("../../../lib/errors.js");

exports.testIntermediateEventValidation_OK = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myIntermediateCatchEventTestProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNIntermediateCatchEvent("_3", "My Intermediate Catch Event", "intermediateCatchEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "End Event", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var errorQueue = errorQueueModule.createErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [],
        "testIntermediateEventValidation_OK");
    test.done();

};

exports.testIntermediateEventValidation_FO3_FO5 = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myIntermediateCatchEventTestProcess");
    processDefinition.addFlowObject(new BPMNIntermediateCatchEvent("_3", "My Intermediate Catch Event", "intermediateCatchEvent"));

    var errorQueue = errorQueueModule.createErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "FO5",
                "description": "The intermediateCatchEvent 'My Intermediate Catch Event' must have at least one incoming sequence flow."
            },
            {
                "code": "FO3",
                "description": "The intermediateCatchEvent 'My Intermediate Catch Event' must have exactly one outgoing sequence flow."
            }
        ],
        "testIntermediateEventValidation_FO3_FO5");
    test.done();

};