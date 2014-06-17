/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnDefinitions = require('../../../lib/parsing/definitions.js');
var path = require('path');

exports.testGetOneBPMNProcessDefinition = function(test) {
    var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    bpmnDefinitions.clearCache();
    var processDefinition = bpmnDefinitions.getBPMNProcessDefinition(fileName);

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
                    "isWaitTask": true
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
            "messageFlows": [],
            "processElementIndex": null,
            "sequenceFlowBySourceIndex": {
                "_2": [
                    {
                        "bpmnId": "_4",
                        "name": "flow1",
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_3",
                        "isSequenceFlow": true
                    }
                ],
                "_3": [
                    {
                        "bpmnId": "_6",
                        "name": "flow2",
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_5",
                        "isSequenceFlow": true
                    }
                ]
            },
            "sequenceFlowByTargetIndex": {
                "_3": [
                    {
                        "bpmnId": "_4",
                        "name": "flow1",
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_3",
                        "isSequenceFlow": true
                    }
                ],
                "_5": [
                    {
                        "bpmnId": "_6",
                        "name": "flow2",
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_5",
                        "isSequenceFlow": true
                    }
                ]
            },
            "messageFlowBySourceIndex": null,
            "messageFlowByTargetIndex": null,
            "boundaryEventsByAttachmentIndex": null,
            "nameMap": null,
            "isProcessDefinition": true,
            "collaboratingParticipants": []
        },
        "testGetOneBPMNProcessDefinition");

    test.done();
};

exports.testGetAllBPMNProcessDefinitions = function(test) {
    var fileName = path.join(__dirname, "../../resources/bpmn/pool.bpmn");
    bpmnDefinitions.clearCache();
    var processDefinitions = bpmnDefinitions.getBPMNProcessDefinitions(fileName);

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
                "processElementIndex": {
                    "_3": {
                        "bpmnId": "_3",
                        "name": "Start Event 1",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    "_4": {
                        "bpmnId": "_4",
                        "name": "Task 1",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
                    },
                    "_6": {
                        "bpmnId": "_6",
                        "name": "End Event 1",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    "_5": {
                        "bpmnId": "_5",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_4",
                        "isSequenceFlow": true
                    },
                    "_7": {
                        "bpmnId": "_7",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_4",
                        "targetRef": "_6",
                        "isSequenceFlow": true
                    },
                    "_12": {
                        "bpmnId": "_12",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_11",
                        "targetRef": "_10",
                        "isSequenceFlow": true
                    },
                    "_13": {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_10",
                        "targetRef": "_9",
                        "isSequenceFlow": true
                    }
                },
                "sequenceFlowBySourceIndex": {
                    "_3": [
                        {
                            "bpmnId": "_5",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_3",
                            "targetRef": "_4",
                            "isSequenceFlow": true
                        }
                    ],
                    "_4": [
                        {
                            "bpmnId": "_7",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_4",
                            "targetRef": "_6",
                            "isSequenceFlow": true
                        }
                    ],
                    "_11": [
                        {
                            "bpmnId": "_12",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_11",
                            "targetRef": "_10",
                            "isSequenceFlow": true
                        }
                    ],
                    "_10": [
                        {
                            "bpmnId": "_13",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_10",
                            "targetRef": "_9",
                            "isSequenceFlow": true
                        }
                    ]
                },
                "sequenceFlowByTargetIndex": {
                    "_4": [
                        {
                            "bpmnId": "_5",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_3",
                            "targetRef": "_4",
                            "isSequenceFlow": true
                        }
                    ],
                    "_6": [
                        {
                            "bpmnId": "_7",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_4",
                            "targetRef": "_6",
                            "isSequenceFlow": true
                        }
                    ],
                    "_10": [
                        {
                            "bpmnId": "_12",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_11",
                            "targetRef": "_10",
                            "isSequenceFlow": true
                        }
                    ],
                    "_9": [
                        {
                            "bpmnId": "_13",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_10",
                            "targetRef": "_9",
                            "isSequenceFlow": true
                        }
                    ]
                },
                "messageFlowBySourceIndex": null,
                "messageFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true,
                "collaboratingParticipants": [
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
                "processElementIndex": {
                    "_11": {
                        "bpmnId": "_11",
                        "name": "Start Event 2",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    "_10": {
                        "bpmnId": "_10",
                        "name": "Task 2",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
                    },
                    "_9": {
                        "bpmnId": "_9",
                        "name": "End Event 2",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    "_12": {
                        "bpmnId": "_12",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_11",
                        "targetRef": "_10",
                        "isSequenceFlow": true
                    },
                    "_13": {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_10",
                        "targetRef": "_9",
                        "isSequenceFlow": true
                    }
                },
                "sequenceFlowBySourceIndex": {
                    "_11": [
                        {
                            "bpmnId": "_12",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_11",
                            "targetRef": "_10",
                            "isSequenceFlow": true
                        }
                    ],
                    "_10": [
                        {
                            "bpmnId": "_13",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_10",
                            "targetRef": "_9",
                            "isSequenceFlow": true
                        }
                    ]
                },
                "sequenceFlowByTargetIndex": {
                    "_10": [
                        {
                            "bpmnId": "_12",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_11",
                            "targetRef": "_10",
                            "isSequenceFlow": true
                        }
                    ],
                    "_9": [
                        {
                            "bpmnId": "_13",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_10",
                            "targetRef": "_9",
                            "isSequenceFlow": true
                        }
                    ]
                },
                "messageFlowBySourceIndex": null,
                "messageFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true,
                "collaboratingParticipants": [
                    {
                        "bpmnId": "_2",
                        "name": "My First Process",
                        "type": "participant",
                        "processRef": "PROCESS_1"
                    },
                    {
                        "bpmnId": "_14",
                        "name": "My Third Process",
                        "type": "participant",
                        "processRef": "PROCESS_3"
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
                "processElementIndex": {
                    "_15": {
                        "bpmnId": "_15",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    "_16": {
                        "bpmnId": "_16",
                        "name": "Task 3",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
                    },
                    "_18": {
                        "bpmnId": "_18",
                        "name": "End Event 3",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    "_17": {
                        "bpmnId": "_17",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_15",
                        "targetRef": "_16",
                        "isSequenceFlow": true
                    },
                    "_19": {
                        "bpmnId": "_19",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_16",
                        "targetRef": "_18",
                        "isSequenceFlow": true
                    }
                },
                "sequenceFlowBySourceIndex": {
                    "_15": [
                        {
                            "bpmnId": "_17",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_15",
                            "targetRef": "_16",
                            "isSequenceFlow": true
                        }
                    ],
                    "_16": [
                        {
                            "bpmnId": "_19",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_16",
                            "targetRef": "_18",
                            "isSequenceFlow": true
                        }
                    ]
                },
                "sequenceFlowByTargetIndex": {
                    "_16": [
                        {
                            "bpmnId": "_17",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_15",
                            "targetRef": "_16",
                            "isSequenceFlow": true
                        }
                    ],
                    "_18": [
                        {
                            "bpmnId": "_19",
                            "name": null,
                            "type": "sequenceFlow",
                            "sourceRef": "_16",
                            "targetRef": "_18",
                            "isSequenceFlow": true
                        }
                    ]
                },
                "messageFlowBySourceIndex": null,
                "messageFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true,
                "collaboratingParticipants": [
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
                ]
            }
        ],
        "testGetAllBPMNProcessDefinitions");

    test.done();
};

exports.testGetAllBPMNCollaborationDefinitions = function(test) {
    var fileName = path.join(__dirname, "../../resources/bpmn/pool.bpmn");
    bpmnDefinitions.clearCache();
    var collaborationDefinitions = bpmnDefinitions.getBPMNCollaborationDefinitions(fileName);

    test.deepEqual(collaborationDefinitions,
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
        "testGetAllBPMNCollaborationDefinitions");

    test.done();
};