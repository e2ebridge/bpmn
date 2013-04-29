/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');

exports.testParseBPMNSubProcess = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/subProcess.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "SubProcess",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "My Sub-Process",
                        "type": "subProcess",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitActivity": false,
                        "isSubProcess": true,
                        "processDefinition": {
                            "bpmnId": "_3",
                            "name": "My Sub-Process",
                            "flowObjects": [
                                {
                                    "bpmnId": "_5",
                                    "name": "Sub Start Event",
                                    "type": "startEvent",
                                    "isFlowObject": true,
                                    "isStartEvent": true
                                },
                                {
                                    "bpmnId": "_6",
                                    "name": "Task",
                                    "type": "task",
                                    "isFlowObject": true,
                                    "isActivity": true,
                                    "isWaitActivity": true
                                },
                                {
                                    "bpmnId": "_7",
                                    "name": "End Event",
                                    "type": "endEvent",
                                    "isFlowObject": true,
                                    "isEndEvent": true
                                }
                            ],
                            "sequenceFlows": [
                                {
                                    "bpmnId": "_9",
                                    "name": null,
                                    "type": "sequenceFlow",
                                    "sourceRef": "_5",
                                    "targetRef": "_6",
                                    "isSequenceFlow": true
                                },
                                {
                                    "bpmnId": "_10",
                                    "name": null,
                                    "type": "sequenceFlow",
                                    "sourceRef": "_6",
                                    "targetRef": "_7",
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
                        }
                    },
                    {
                        "bpmnId": "_4",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_12",
                        "name": "My Boundary Event",
                        "type": "boundaryEvent",
                        "isFlowObject": true,
                        "isBoundaryEvent": true,
                        "attachedToRef": "_3"
                    },
                    {
                        "bpmnId": "_13",
                        "name": "End After Boundary Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_8",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_3",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_11",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_4",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_14",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_12",
                        "targetRef": "_13",
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
            }
        ],
        "testParseBPMNSubProcess");
    test.done();
};
