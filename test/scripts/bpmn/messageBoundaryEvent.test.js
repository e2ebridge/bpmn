/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');

exports.testParseBPMNMessageBoundaryEvent = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/messageBoundaryEvent.bpmn");
    test.equal(bpmnProcessDefinitions.length, 1, "testParseBPMNMessageBoundaryEvent: number of processDefinitions");
    var bpmnProcessDefinition = bpmnProcessDefinitions[0];

    test.deepEqual(bpmnProcessDefinition,
        {
            "bpmnId": "PROCESS_1",
            "name": "MessageBoundaryEvent",
            "flowObjects": [
                {
                    "bpmnId": "_2",
                    "name": "MyStart",
                    "type": "startEvent",
                    "isFlowObject": true,
                    "isStartEvent": true
                },
                {
                    "bpmnId": "_3",
                    "name": "MyTask",
                    "type": "task",
                    "isFlowObject": true,
                    "isActivity": true,
                    "isWaitTask": true
                },
                {
                    "bpmnId": "_5",
                    "name": "MyEnd",
                    "type": "endEvent",
                    "isFlowObject": true,
                    "isEndEvent": true
                },
                {
                    "bpmnId": "_6",
                    "name": "My Message Boundary Event",
                    "type": "boundaryEvent",
                    "isFlowObject": true,
                    "isBoundaryEvent": true,
                    "attachedToRef": "_3",
                    "isMessageEvent": true
                }
            ],
            "sequenceFlows": [
                {
                    "bpmnId": "_4",
                    "name": null,
                    "type": "sequenceFlow",
                    "sourceRef": "_2",
                    "targetRef": "_3",
                    "isSequenceFlow": true
                },
                {
                    "bpmnId": "_9",
                    "name": null,
                    "type": "sequenceFlow",
                    "sourceRef": "_6",
                    "targetRef": "_5",
                    "isSequenceFlow": true
                }
            ],
            "messageFlows": [],
            "processElementIndex": null,
            "sequenceFlowBySourceIndex": null,
            "sequenceFlowByTargetIndex": null,
            "messageFlowBySourceIndex": null,
            "messageFlowByTargetIndex": null,
            "boundaryEventsByAttachmentIndex": null,
            "nameMap": null,
            "isProcessDefinition": true,
            "collaboratingParticipants": []
        },
        "testParseBPMNMessageBoundaryEvent");
    test.done();
};
