/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');

exports.testParseXorMerge = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("./test/resources/bpmn/xorMerge.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "XorMerge",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event1",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "Start Event2",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_4",
                        "name": "Exclusive Converging Gateway",
                        "type": "exclusiveGateway",
                        "isFlowObject": true,
                        "isExclusiveGateway": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "End Event",
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
                        "sourceRef": "_2",
                        "targetRef": "_4",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_6",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_4",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_10",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_4",
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
                "collaboratingParticipants": []
            }
        ],
        "testParseXorMerge");
    test.done();
};

exports.testParseXorGateway = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/xorGateway.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "XorGateway",
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
                        "name": "First Task",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitActivity": true
                    },
                    {
                        "bpmnId": "_5",
                        "name": "Is it ok?",
                        "type": "exclusiveGateway",
                        "isFlowObject": true,
                        "isExclusiveGateway": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "Task A",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitActivity": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "Task B",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitActivity": true
                    },
                    {
                        "bpmnId": "_11",
                        "name": "End Event A",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_12",
                        "name": "End Event B",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
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
                        "bpmnId": "_6",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_5",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_8",
                        "name": "nok",
                        "type": "sequenceFlow",
                        "sourceRef": "_5",
                        "targetRef": "_7",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_10",
                        "name": "ok",
                        "type": "sequenceFlow",
                        "sourceRef": "_5",
                        "targetRef": "_9",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_9",
                        "targetRef": "_12",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_14",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_7",
                        "targetRef": "_11",
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
        "testParseXorGateway");
    test.done();
};
