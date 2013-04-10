/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');

exports.testParseBPMNParallelGateway = function(test) {

    var bpmnObject = bpmnParserModule.parse("test/resources/bpmn/parallelGateway.bpmn");
    test.deepEqual(bpmnObject,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "ParallelGateway",
                "tasks": [
                    {
                        "bpmnId": "_5",
                        "name": "Task A",
                        "type": "task",
                        "outgoingRefs": [],
                        "incomingRefs": [
                            "_7"
                        ],
                        "waitForTaskDoneEvent": true
                    },
                    {
                        "bpmnId": "_6",
                        "name": "Task B",
                        "type": "task",
                        "outgoingRefs": [],
                        "incomingRefs": [
                            "_8"
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
                "endEvents": [],
                "sequenceFlows": [
                    {
                        "bpmnId": "_4",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_3"
                    },
                    {
                        "bpmnId": "_7",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_5"
                    },
                    {
                        "bpmnId": "_8",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_6"
                    }
                ],
                "gateways": [
                    {
                        "bpmnId": "_3",
                        "name": "Parallel Gateway",
                        "type": "parallelGateway",
                        "outgoingRefs": [
                            "_7",
                            "_8"
                        ],
                        "incomingRefs": [
                            "_4"
                        ],
                        "isParallelGateway": true
                    }
                ],
                "processElementIndex": null,
                "nameMap": null
            }
        ],
        "testParseBPMNParallelGateway");
    test.done();
};
