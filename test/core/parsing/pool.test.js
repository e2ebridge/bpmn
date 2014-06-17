/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var fs = require('fs');
var bpmnDefinitions = require('../../../lib/parsing/definitions.js');
var bpmnParser = require('../../../lib/parsing/parser.js');

var fileName = path.join(__dirname, "../../resources/bpmn/pool.bpmn");
var collaborations = bpmnDefinitions.getBPMNCollaborationDefinitions(fileName);

exports.testGetCollaboratingParticipants = function(test) {
    var collaboration = collaborations[0];

    var collaboratingParticipants = collaboration.getCollaboratingParticipants("PROCESS_1");
    test.deepEqual(collaboratingParticipants,
        [
            {
                "bpmnId": "_8",
                "name": "My Second Process",
                "type": "participant",
                "processRef": "PROCESS_2"
            },
            {
                "bpmnId": "_14",
                "name": "My Third Process",
                "type": "participant",
                "processRef": "PROCESS_3"
            }
        ],
        "testGetCollaboratingParticipants."
    );

    test.done();
};

exports.testGetParticipantByProcessId = function(test) {
    var collaboration = collaborations[0];

    var processParticipant = collaboration.getParticipantByProcessId("PROCESS_1");
    test.deepEqual(processParticipant,
        {
            "bpmnId": "_2",
            "name": "My First Process",
            "type": "participant",
            "processRef": "PROCESS_1"
        },
        "testGetParticipantByProcessId."
    );

    test.done();
};

exports.testGetBPMNProcessDefinitionsOfCollaboratingProcesses = function(test) {
    var processDefinitions = bpmnDefinitions.getBPMNProcessDefinitions(fileName);

    var process1 = processDefinitions[0];
    test.equal(process1.name, "My First Process", "testGetBPMNProcessDefinitionsOfCollaboratingProcesses: process 1 name == pool 1 name");

    var process2 = processDefinitions[1];
    test.equal(process2.name, "My Second Process", "testGetBPMNProcessDefinitionsOfCollaboratingProcesses: process 2 name == pool 2 name");

    test.deepEqual(process1.collaboratingParticipants,
        [
            {
                "bpmnId": "_8",
                "name": "My Second Process",
                "type": "participant",
                "processRef": "PROCESS_2"
            },
            {
                "bpmnId": "_14",
                "name": "My Third Process",
                "type": "participant",
                "processRef": "PROCESS_3"
            }
        ],
        "testGetBPMNProcessDefinitionsOfCollaboratingProcesses"
    );

    test.done();
};

exports.testGetBPMNCollaborationDefinitions = function(test) {
    test.deepEqual(collaborations,
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
                    },
                    {
                        "bpmnId": "_14",
                        "name": "My Third Process",
                        "type": "participant",
                        "processRef": "PROCESS_3"
                    }
                ],
                "messageFlows": [
                    {
                        "bpmnId": "_12",
                        "name": null,
                        "type": "messageFlow",
                        "sourceRef": "_11",
                        "targetRef": "_10",
                        "targetProcessDefinitionId": "PROCESS_2",
                        "sourceProcessDefinitionId": null
                    },
                    {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "messageFlow",
                        "sourceRef": "_10",
                        "targetRef": "_9",
                        "targetProcessDefinitionId": "PROCESS_2",
                        "sourceProcessDefinitionId": null
                    }
                ],
                "isCollaborationDefinition": true
            }
        ],
        "testGetBPMNCollaborationDefinitions."
    );

    test.done();
};

exports.testParseCollaborationsBetweenPools = function(test) {

    var bpmnXML = fs.readFileSync(fileName, "utf8");
    var bpmnProcessDefinitions = bpmnParser.parse(bpmnXML);
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
                    },
                    {
                        "bpmnId": "_14",
                        "name": "My Third Process",
                        "type": "participant",
                        "processRef": "PROCESS_3"
                    }
                ],
                "messageFlows": [
                    {
                        "bpmnId": "_12",
                        "name": null,
                        "type": "messageFlow",
                        "sourceRef": "_11",
                        "targetRef": "_10",
                        "targetProcessDefinitionId": null,
                        "sourceProcessDefinitionId": null
                    },
                    {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "messageFlow",
                        "sourceRef": "_10",
                        "targetRef": "_9",
                        "targetProcessDefinitionId": null,
                        "sourceProcessDefinitionId": null
                    }
                ],
                "isCollaborationDefinition": true
            },
            {
                "bpmnId": "PROCESS_1",
                "name": null,
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
                        "isWaitTask": true
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
                "bpmnId": "PROCESS_2",
                "name": null,
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
                        "isWaitTask": true
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
                "bpmnId": "PROCESS_3",
                "name": null,
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
                        "isWaitTask": true
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
            }
        ],
        "testParseCollaborationsBetweenPools");
    test.done();
};
