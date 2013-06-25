/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var bpmnDefinitionsModule = require('../../../lib/parsing/definitions.js');
var bpmnParserModule = require('../../../lib/parsing/parser.js');

var fileName = pathModule.join(__dirname, "../../resources/bpmn/poolNotExecutable.bpmn");
var collaborations = bpmnDefinitionsModule.getBPMNCollaborationDefinitions(fileName);

exports.testGetNonExecutableCollaborationParticipants = function(test) {
    var collaboration = collaborations[0];

    var collaboratingParticipants = collaboration.getCollaboratingParticipants("PROCESS_1");
    test.deepEqual(collaboratingParticipants,
        [
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
        "testGetNonExecutableCollaborationParticipants."
    );

    test.done();
};

exports.testGetExecutableParticipantByProcessId = function(test) {
    var collaboration = collaborations[0];

    var processParticipant = collaboration.getParticipantByProcessId("PROCESS_1");
    test.deepEqual(processParticipant,
        {
            "bpmnId": "_2",
            "name": "My First Process",
            "type": "participant",
            "processRef": "PROCESS_1",
            "bpmnFileName": fileName
        },
        "testGetExecutableParticipantByProcessId."
    );

    test.done();
};

exports.testGetNonExecutableParticipantByProcessId = function(test) {
    var collaboration = collaborations[0];

    var processParticipant = collaboration.getParticipantByProcessId("PROCESS_2");
    test.deepEqual(processParticipant,
        {
            "bpmnId": "_8",
            "name": "My Second Process",
            "type": "participant",
            "processRef": "PROCESS_2",
            "bpmnFileName": "D:\\Projects\\bpmn.js\\test\\resources\\bpmn\\poolNotExecutable.bpmn"
        },
        "testGetNonExecutableParticipantByProcessId."
    );

    test.done();
};

exports.testGetBPMNProcessDefinitionsOfNonExecutableCollaboratingProcesses = function(test) {
    var processDefinitions = bpmnDefinitionsModule.getBPMNProcessDefinitions(fileName);

    test.equal(processDefinitions.length, 1, "testGetBPMNProcessDefinitionsOfNonExecutableCollaboratingProcesses: we have one executable process");

    var process1 = processDefinitions[0];
    test.equal(process1.name, "My First Process", "testGetBPMNProcessDefinitionsOfNonExecutableCollaboratingProcesses: process 1 name == pool 1 name");


    test.deepEqual(process1.collaboratingParticipants,
        [
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
        "testGetBPMNProcessDefinitionsOfNonExecutableCollaboratingProcesses"
    );

    test.done();
};

exports.testGetBPMNNonExecutableCollaborationDefinitions = function(test) {
    test.deepEqual(collaborations,
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
            }
        ],
        "testGetBPMNNonExecutableCollaborationDefinitions."
    );

    test.done();
};

exports.testParseCollaborationsBetweenExecutableAndNonExecutablePools = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse(fileName);
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "COLLABORATION_1",
                "participants": [
                    {
                        "bpmnId": "_2",
                        "name": "My First Process",
                        "type": "participant",
                        "processRef": "PROCESS_1",
                        "bpmnFileName": "D:\\Projects\\bpmn.js\\test\\resources\\bpmn\\poolNotExecutable.bpmn"
                    },
                    {
                        "bpmnId": "_8",
                        "name": "My Second Process",
                        "type": "participant",
                        "processRef": "PROCESS_2",
                        "bpmnFileName": "D:\\Projects\\bpmn.js\\test\\resources\\bpmn\\poolNotExecutable.bpmn"
                    },
                    {
                        "bpmnId": "_14",
                        "name": "My Third Process",
                        "type": "participant",
                        "processRef": "PROCESS_3",
                        "bpmnFileName": "D:\\Projects\\bpmn.js\\test\\resources\\bpmn\\poolNotExecutable.bpmn"
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
                "name": "PoolNotExecutable",
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
            }
        ],
        "testParseCollaborationsBetweenExecutableAndNonExecutablePools");
    test.done();
};
