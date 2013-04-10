/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');

exports.testParseExclusiveConvergingGateway = function(test) {

    var bpmnObject = bpmnParserModule.parse("test/resources/bpmn/exclusiveConvergingGateway.bpmn");
    test.deepEqual(bpmnObject,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "ExclusiveConvergingGateway",
                "tasks": [],
                "startEvents": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event1",
                        "type": "startEvent",
                        "incomingRefs": [],
                        "outgoingRefs": [
                            "_5"
                        ]
                    },
                    {
                        "bpmnId": "_3",
                        "name": "Start Event2",
                        "type": "startEvent",
                        "incomingRefs": [],
                        "outgoingRefs": [
                            "_6"
                        ]
                    }
                ],
                "endEvents": [
                    {
                        "bpmnId": "_9",
                        "name": "End Event",
                        "type": "endEvent",
                        "incomingRefs": [
                            "_10"
                        ],
                        "outgoingRefs": []
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_5",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_4"
                    },
                    {
                        "bpmnId": "_6",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_4"
                    },
                    {
                        "bpmnId": "_10",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_4",
                        "targetRef": "_9"
                    }
                ],
                "gateways": [
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
                        "isExclusiveGateway": true
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

    var bpmnObject = bpmnParserModule.parse("test/resources/bpmn/exclusiveDivergingGateway.bpmn");
    test.deepEqual(bpmnObject,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "ExclusiveDivergingGateway",
                "tasks": [
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
                        "waitForTaskDoneEvent": true
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
                        "waitForTaskDoneEvent": true
                    }
                ],
                "startEvents": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event",
                        "type": "startEvent",
                        "incomingRefs": [],
                        "outgoingRefs": [
                            "_4"
                        ]
                    }
                ],
                "endEvents": [
                    {
                        "bpmnId": "_11",
                        "name": "End Event A",
                        "type": "endEvent",
                        "incomingRefs": [
                            "_14"
                        ],
                        "outgoingRefs": []
                    },
                    {
                        "bpmnId": "_12",
                        "name": "End Event B",
                        "type": "endEvent",
                        "incomingRefs": [
                            "_13"
                        ],
                        "outgoingRefs": []
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_4",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_3"
                    },
                    {
                        "bpmnId": "_6",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_5"
                    },
                    {
                        "bpmnId": "_8",
                        "name": "nok",
                        "type": "sequenceFlow",
                        "sourceRef": "_5",
                        "targetRef": "_7"
                    },
                    {
                        "bpmnId": "_10",
                        "name": "ok",
                        "type": "sequenceFlow",
                        "sourceRef": "_5",
                        "targetRef": "_9"
                    },
                    {
                        "bpmnId": "_13",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_9",
                        "targetRef": "_12"
                    },
                    {
                        "bpmnId": "_14",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_7",
                        "targetRef": "_11"
                    }
                ],
                "gateways": [
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
                        "isExclusiveGateway": true
                    }
                ],
                "processElementIndex": null,
                "nameMap": null
            }
        ],
        "testParseExclusiveDivergingGateway");
    test.done();
};
