/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');

exports.testParseBPMNExclusiveGateway = function(test) {

    var bpmnObject = bpmnParserModule.parse("test/resources/bpmn/exclusiveGateway.bpmn");
    test.deepEqual(bpmnObject,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "ExclusiveGateway",
                "tasks": [
                    {
                        "bpmnId": "_3",
                        "name": "First Task",
                        "type": "task",
                        "outgoingRefs": [
                            "_6"
                        ],
                        "incomingRefs": [
                            "_4"
                        ],
                        "waitForTaskDoneEvent": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "Task A",
                        "type": "task",
                        "outgoingRefs": [
                            "_14"
                        ],
                        "incomingRefs": [
                            "_8"
                        ],
                        "waitForTaskDoneEvent": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "Task B",
                        "type": "task",
                        "outgoingRefs": [
                            "_13"
                        ],
                        "incomingRefs": [
                            "_10"
                        ],
                        "waitForTaskDoneEvent": true
                    }
                ],
                "startEvents": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event",
                        "type": "startEvent",
                        "outgoingRefs": [
                            "_4"
                        ],
                        "incomingRefs": []
                    }
                ],
                "endEvents": [
                    {
                        "bpmnId": "_11",
                        "name": "End Event A",
                        "type": "endEvent",
                        "outgoingRefs": [],
                        "incomingRefs": [
                            "_14"
                        ]
                    },
                    {
                        "bpmnId": "_12",
                        "name": "End Event B",
                        "type": "endEvent",
                        "outgoingRefs": [],
                        "incomingRefs": [
                            "_13"
                        ]
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
                        "outgoingRefs": [
                            "_8",
                            "_10"
                        ],
                        "incomingRefs": [
                            "_6"
                        ],
                        "isExclusiveGateway": true
                    }
                ],
                "processElementIndex": null,
                "nameMap": null
            }
        ],
        "testParseBPMNExclusiveGateway");
    test.done();
};
