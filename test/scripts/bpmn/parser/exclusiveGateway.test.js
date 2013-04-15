/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');

exports.testParseExclusiveConvergingGateway = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/exclusiveConvergingGateway.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "ExclusiveConvergingGateway",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event1",
                        "type": "startEvent",
                        "incomingRefs": [],
                        "outgoingRefs": [
                            "_5"
                        ],
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "Start Event2",
                        "type": "startEvent",
                        "incomingRefs": [],
                        "outgoingRefs": [
                            "_6"
                        ],
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_4",
                        "name": "Exclusive Converging Gateway",
                        "type": "exclusiveGateway",
                        "incomingRefs": [
                            "_5",
                            "_6"
                        ],
                        "outgoingRefs": [
                            "_10"
                        ],
                        "isFlowObject": true,
                        "isExclusiveGateway": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "End Event",
                        "type": "endEvent",
                        "incomingRefs": [
                            "_10"
                        ],
                        "outgoingRefs": [],
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
                "nameMap": null
            }
        ],
        "testParseExclusiveConvergingGateway");
    test.done();
};

exports.testParseExclusiveDivergingGateway = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/exclusiveDivergingGateway.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "ExclusiveDivergingGateway",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event",
                        "type": "startEvent",
                        "incomingRefs": [],
                        "outgoingRefs": [
                            "_4"
                        ],
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "First Task",
                        "type": "task",
                        "incomingRefs": [
                            "_4"
                        ],
                        "outgoingRefs": [
                            "_6"
                        ],
                        "isFlowObject": true,
                        "boundaryEvents": [],
                        "isActivity": true,
                        "hasBoundaryEvents": false,
                        "waitForTaskDoneEvent": true
                    },
                    {
                        "bpmnId": "_5",
                        "name": "Is it ok?",
                        "type": "exclusiveGateway",
                        "incomingRefs": [
                            "_6"
                        ],
                        "outgoingRefs": [
                            "_8",
                            "_10"
                        ],
                        "isFlowObject": true,
                        "isExclusiveGateway": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "Task A",
                        "type": "task",
                        "incomingRefs": [
                            "_8"
                        ],
                        "outgoingRefs": [
                            "_14"
                        ],
                        "isFlowObject": true,
                        "boundaryEvents": [],
                        "isActivity": true,
                        "hasBoundaryEvents": false,
                        "waitForTaskDoneEvent": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "Task B",
                        "type": "task",
                        "incomingRefs": [
                            "_10"
                        ],
                        "outgoingRefs": [
                            "_13"
                        ],
                        "isFlowObject": true,
                        "boundaryEvents": [],
                        "isActivity": true,
                        "hasBoundaryEvents": false,
                        "waitForTaskDoneEvent": true
                    },
                    {
                        "bpmnId": "_11",
                        "name": "End Event A",
                        "type": "endEvent",
                        "incomingRefs": [
                            "_14"
                        ],
                        "outgoingRefs": [],
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_12",
                        "name": "End Event B",
                        "type": "endEvent",
                        "incomingRefs": [
                            "_13"
                        ],
                        "outgoingRefs": [],
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
                "nameMap": null
            }
        ],
        "testParseExclusiveDivergingGateway");
    test.done();
};
