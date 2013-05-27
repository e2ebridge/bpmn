/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNBoundaryEvent = require("../../../lib/parsing/boundaryEvents.js").BPMNBoundaryEvent;
var errorQueueModule = require("../../../lib/errors.js");

exports.testBPMNMessageBoundaryEventValidate_OK = function(test) {

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

    var errorQueue = errorQueueModule.createErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [],
        "testBPMNMessageBoundaryEventValidate_OK");
    test.done();
};

exports.testBPMNMessageBoundaryEventValidate_FO3_FO5 = function(test) {

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

    var errorQueue = errorQueueModule.createErrorQueue();
    processDefinition.validate(errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "FO5",
                "description": "The boundaryEvent 'MyMessageBoundaryEvent' must not have incoming sequence flows."
            },
            {
                "code": "FO3",
                "description": "The boundaryEvent 'MyMessageBoundaryEvent' must have exactly one outgoing sequence flow."
            }
        ],
        "testBPMNMessageBoundaryEventValidate_FO3_FO5");
    test.done();
};
