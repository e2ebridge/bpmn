/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');

exports.testParseParallelConvergingGateway = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/parallelConvergingGateway.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "ParallelConvergingGateway",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event1",
                        "type": "startEvent",
                        "incomingRefs": [],
                        "outgoingRefs": [
                            "_10"
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
                            "_11"
                        ],
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "End Event",
                        "type": "endEvent",
                        "incomingRefs": [
                            "_8"
                        ],
                        "outgoingRefs": [],
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "Parallel Converging Gateway",
                        "type": "parallelGateway",
                        "incomingRefs": [
                            "_10",
                            "_11"
                        ],
                        "outgoingRefs": [
                            "_8"
                        ],
                        "isFlowObject": true,
                        "isParallelGateway": true
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_8",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_7",
                        "targetRef": "_9",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_10",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_7",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_11",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_7",
                        "isSequenceFlow": true
                    }
                ],
                "processElementIndex": null,
                "nameMap": null
            }
        ],
        "testParseParallelConvergingGateway");
    test.done();
};

exports.testParseParallelDivergingGateway = function(test) {

    var bpmnProcesses = bpmnParserModule.parse("test/resources/bpmn/parallelDivergingGateway.bpmn");
    test.deepEqual(bpmnProcesses,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "ParallelDivergingGateway",
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
                        "name": "Parallel Gateway",
                        "type": "parallelGateway",
                        "incomingRefs": [
                            "_4"
                        ],
                        "outgoingRefs": [
                            "_7",
                            "_8"
                        ],
                        "isFlowObject": true,
                        "isParallelGateway": true
                    },
                    {
                        "bpmnId": "_5",
                        "name": "Task A",
                        "type": "task",
                        "incomingRefs": [
                            "_7"
                        ],
                        "outgoingRefs": [],
                        "isFlowObject": true,
                        "boundaryEvents": [],
                        "isActivity": true,
                        "hasBoundaryEvents": false,
                        "waitForTaskDoneEvent": true
                    },
                    {
                        "bpmnId": "_6",
                        "name": "Task B",
                        "type": "task",
                        "incomingRefs": [
                            "_8"
                        ],
                        "outgoingRefs": [],
                        "isFlowObject": true,
                        "boundaryEvents": [],
                        "isActivity": true,
                        "hasBoundaryEvents": false,
                        "waitForTaskDoneEvent": true
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
                        "bpmnId": "_7",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_5",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_8",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_6",
                        "isSequenceFlow": true
                    }
                ],
                "processElementIndex": null,
                "nameMap": null
            }
        ],
        "testParseParallelDivergingGateway");
    test.done();
};
