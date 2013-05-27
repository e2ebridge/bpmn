/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/parsing/parser.js');

exports.testParseBPMNIntermediateMessageEvent = function(test) {

    var fileName = "test/resources/bpmn/intermediateMessageEvent.bpmn";
    var bpmnProcessDefinitions = bpmnParserModule.parse(fileName);
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "IntermediateMessageEvent",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true,
                        "isMessageEvent": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_4",
                        "name": "Intermediate Message Event",
                        "type": "intermediateThrowEvent",
                        "isFlowObject": true,
                        "isIntermediateThrowEvent": true,
                        "isMessageEvent": true
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_5",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_4",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_6",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_4",
                        "targetRef": "_3",
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
            {
                "bpmnId": "COLLABORATION_1",
                "participants": [
                    {
                        "bpmnId": "_7",
                        "name": "Participant",
                        "type": "participant",
                        "processRef": null,
                        "bpmnFileName": fileName
                    }
                ],
                "messageFlows": [
                    {
                        "bpmnId": "_8",
                        "name": null,
                        "type": "messageFlow",
                        "sourceRef": "_7",
                        "targetRef": "_2",
                        "targetProcessDefinitionId": null,
                        "sourceProcessDefinitionId": null
                    },
                    {
                        "bpmnId": "_9",
                        "name": null,
                        "type": "messageFlow",
                        "sourceRef": "_4",
                        "targetRef": "_7",
                        "targetProcessDefinitionId": null,
                        "sourceProcessDefinitionId": null
                    }
                ],
                "isCollaborationDefinition": true
            }
        ],
        "testParseBPMNIntermediateMessageEvent");
    test.done();
};
