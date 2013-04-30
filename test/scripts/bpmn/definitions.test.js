/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnDefinitionsModule = require('../../../lib/bpmn/definitions.js');
var pathModule = require('path');

exports.testGetOneBPMNProcessDefinition = function(test) {
    var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    bpmnDefinitionsModule.clearBPMNDefinitionsCache();
    var processDefinition = bpmnDefinitionsModule.getBPMNProcessDefinition(fileName);
    test.deepEqual(processDefinition,
        {
            "bpmnId": "PROCESS_1",
            "name": "TaskExampleProcess",
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
                    "isWaitActivity": true
                },
                {
                    "bpmnId": "_5",
                    "name": "MyEnd",
                    "type": "endEvent",
                    "isFlowObject": true,
                    "isEndEvent": true
                }
            ],
            "sequenceFlows": [
                {
                    "bpmnId": "_4",
                    "name": "flow1",
                    "type": "sequenceFlow",
                    "sourceRef": "_2",
                    "targetRef": "_3",
                    "isSequenceFlow": true
                },
                {
                    "bpmnId": "_6",
                    "name": "flow2",
                    "type": "sequenceFlow",
                    "sourceRef": "_3",
                    "targetRef": "_5",
                    "isSequenceFlow": true
                }
            ],
            "processElementIndex": null,
            "sequenceFlowBySourceIndex": null,
            "sequenceFlowByTargetIndex": null,
            "boundaryEventsByAttachmentIndex": null,
            "nameMap": null,
            "isProcessDefinition": true,
            "collaboratingParticipants": []
        },
        "testGetOneBPMNProcessDefinition");

    test.done();
};

exports.testGetAllBPMNProcessDefinitions = function(test) {
    var fileName = pathModule.join(__dirname, "../../resources/bpmn/pool.bpmn");
    bpmnDefinitionsModule.clearBPMNDefinitionsCache();
    var processDefinitions = bpmnDefinitionsModule.getBPMNProcessDefinitions(fileName);
    test.deepEqual(processDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "My First Process",
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
                "isProcessDefinition": true,
                "collaboratingParticipants": [],
                "collaboratingParticipants": [
                    {
                        "bpmnId": "_8",
                        "name": "My Second Process",
                        "type": "participant",
                        "processRef": "PROCESS_2",
                        "bpmnFileName": fileName
                    },
                    {
                        "bpmnId": "_14",
                        "name": "My Third Process",
                        "type": "participant",
                        "processRef": "PROCESS_3",
                        "bpmnFileName": fileName
                    }
                ]
            },
            {
                "bpmnId": "PROCESS_2",
                "name": "My Second Process",
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
                "isProcessDefinition": true,
                "collaboratingParticipants": [],
                "collaboratingParticipants": [
                    {
                        "bpmnId": "_2",
                        "name": "My First Process",
                        "type": "participant",
                        "processRef": "PROCESS_1",
                        "bpmnFileName": fileName
                    },
                    {
                        "bpmnId": "_14",
                        "name": "My Third Process",
                        "type": "participant",
                        "processRef": "PROCESS_3",
                        "bpmnFileName": fileName
                    }
                ]
            },
            {
                "bpmnId": "PROCESS_3",
                "name": "My Third Process",
                "flowObjects": [
                    {
                        "bpmnId": "_15",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_16",
                        "name": "Task 3",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitActivity": true
                    },
                    {
                        "bpmnId": "_18",
                        "name": "End Event 3",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_17",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_15",
                        "targetRef": "_16",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_19",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_16",
                        "targetRef": "_18",
                        "isSequenceFlow": true
                    }
                ],
                "processElementIndex": null,
                "sequenceFlowBySourceIndex": null,
                "sequenceFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true,
                "collaboratingParticipants": [],
                "collaboratingParticipants": [
                    {
                        "bpmnId": "_2",
                        "name": "My First Process",
                        "type": "participant",
                        "processRef": "PROCESS_1",
                        "bpmnFileName": fileName
                    },
                    {
                        "bpmnId": "_8",
                        "name": "My Second Process",
                        "type": "participant",
                        "processRef": "PROCESS_2",
                        "bpmnFileName": fileName
                    }
                ]
            }
        ],
        "testGetAllBPMNProcessDefinitions");

    test.done();
};

exports.testGetAllBPMNCollaborationDefinitions = function(test) {
    var fileName = pathModule.join(__dirname, "../../resources/bpmn/pool.bpmn");
    bpmnDefinitionsModule.clearBPMNDefinitionsCache();
    var collaborationDefinitions = bpmnDefinitionsModule.getBPMNCollaborationDefinitions(fileName);
    test.deepEqual(collaborationDefinitions,
        [
            {
                "bpmnId": "COLLABORATION_1",
                "participants": [
                    {
                        "bpmnId": "_2",
                        "name": "My First Process",
                        "type": "participant",
                        "processRef": "PROCESS_1",
                        "bpmnFileName": fileName
                    },
                    {
                        "bpmnId": "_8",
                        "name": "My Second Process",
                        "type": "participant",
                        "processRef": "PROCESS_2",
                        "bpmnFileName": fileName
                    },
                    {
                        "bpmnId": "_14",
                        "name": "My Third Process",
                        "type": "participant",
                        "processRef": "PROCESS_3",
                        "bpmnFileName": fileName
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
                "isCollaborationDefinition": true
            }
        ],
        "testGetAllBPMNCollaborationDefinitions");

    test.done();
};