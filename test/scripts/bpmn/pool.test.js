/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');

exports.testParseCollaborationsBetweenPools = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/pool.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "COLLABORATION_1",
                "participants": [
                    {
                        "bpmnId": "_2",
                        "name": "My First Process",
                        "type": "participant",
                        "processRef": "PROCESS_1"
                    },
                    {
                        "bpmnId": "_8",
                        "name": "My Second Process",
                        "type": "participant",
                        "processRef": "PROCESS_2"
                    }
                ],
                "messageFlows": [
                    {
                        "bpmnId": "_12",
                        "name": null,
                        "type": "messageFlow",
                        "sourceRef": "_11",
                        "targetRef": "_10"
                    },
                    {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "messageFlow",
                        "sourceRef": "_10",
                        "targetRef": "_9"
                    }
                ],
                "isCollaboration": true
            },
            {
                "bpmnId": "PROCESS_1",
                "name": "Pool",
                "flowObjects": [
                    {
                        "bpmnId": "_3",
                        "name": "Start Event 1",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_4",
                        "name": "Task 1",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitActivity": true
                    },
                    {
                        "bpmnId": "_6",
                        "name": "End Event 1",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_5",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_4",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_4",
                        "targetRef": "_6",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_12",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_11",
                        "targetRef": "_10",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_10",
                        "targetRef": "_9",
                        "isSequenceFlow": true
                    }
                ],
                "processElementIndex": null,
                "sequenceFlowBySourceIndex": null,
                "sequenceFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true
            },
            {
                "bpmnId": "PROCESS_2",
                "name": "Pool",
                "flowObjects": [
                    {
                        "bpmnId": "_11",
                        "name": "Start Event 2",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_10",
                        "name": "Task 2",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitActivity": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "End Event 2",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_12",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_11",
                        "targetRef": "_10",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_10",
                        "targetRef": "_9",
                        "isSequenceFlow": true
                    }
                ],
                "processElementIndex": null,
                "sequenceFlowBySourceIndex": null,
                "sequenceFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true
            }
        ],
        "testParseCollaborationsBetweenPools");
    test.done();
};

