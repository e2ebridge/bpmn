/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');

exports.testParseBPMNTimeout = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/timeoutExampleProcess.bpmn");
    test.equal(bpmnProcessDefinitions.length, 1, "testParseBPMNTimeout: number of processDefinitions");
    var bpmnProcessDefinition = bpmnProcessDefinitions[0];
    bpmnProcessDefinition.attachBoundaryEvents();

    test.deepEqual(bpmnProcessDefinition,
        {
            "bpmnId": "PROCESS_1",
            "name": "TimeoutExampleProcess",
            "flowObjects": [
                {
                    "bpmnId": "_2",
                    "name": "MyStart",
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
                    "name": "MyTask",
                    "type": "task",
                    "incomingRefs": [
                        "_4"
                    ],
                    "outgoingRefs": [],
                    "isFlowObject": true,
                    "boundaryEvents": [
                        {
                            "bpmnId": "_7",
                            "name": "MyTimeout",
                            "type": "boundaryEvent",
                            "incomingRefs": [],
                            "outgoingRefs": [
                                "_8"
                            ],
                            "isFlowObject": true,
                            "isBoundaryEvent": true,
                            "attachedToRef": "_3",
                            "isTimerEvent": true
                        }
                    ],
                    "isActivity": true,
                    "hasBoundaryEvents": true,
                    "waitForTaskDoneEvent": true
                },
                {
                    "bpmnId": "_5",
                    "name": "MyEnd",
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
                    "name": "MyTimeout",
                    "type": "boundaryEvent",
                    "incomingRefs": [],
                    "outgoingRefs": [
                        "_8"
                    ],
                    "isFlowObject": true,
                    "isBoundaryEvent": true,
                    "attachedToRef": "_3",
                    "isTimerEvent": true
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
                    "bpmnId": "_8",
                    "name": null,
                    "type": "sequenceFlow",
                    "sourceRef": "_7",
                    "targetRef": "_5",
                    "isSequenceFlow": true
                }
            ],
            "processElementIndex": {
                "_2": {
                    "bpmnId": "_2",
                    "name": "MyStart",
                    "type": "startEvent",
                    "incomingRefs": [],
                    "outgoingRefs": [
                        "_4"
                    ],
                    "isFlowObject": true,
                    "isStartEvent": true
                },
                "_3": {
                    "bpmnId": "_3",
                    "name": "MyTask",
                    "type": "task",
                    "incomingRefs": [
                        "_4"
                    ],
                    "outgoingRefs": [],
                    "isFlowObject": true,
                    "boundaryEvents": [
                        {
                            "bpmnId": "_7",
                            "name": "MyTimeout",
                            "type": "boundaryEvent",
                            "incomingRefs": [],
                            "outgoingRefs": [
                                "_8"
                            ],
                            "isFlowObject": true,
                            "isBoundaryEvent": true,
                            "attachedToRef": "_3",
                            "isTimerEvent": true
                        }
                    ],
                    "isActivity": true,
                    "hasBoundaryEvents": true,
                    "waitForTaskDoneEvent": true
                },
                "_5": {
                    "bpmnId": "_5",
                    "name": "MyEnd",
                    "type": "endEvent",
                    "incomingRefs": [
                        "_8"
                    ],
                    "outgoingRefs": [],
                    "isFlowObject": true,
                    "isEndEvent": true
                },
                "_7": {
                    "bpmnId": "_7",
                    "name": "MyTimeout",
                    "type": "boundaryEvent",
                    "incomingRefs": [],
                    "outgoingRefs": [
                        "_8"
                    ],
                    "isFlowObject": true,
                    "isBoundaryEvent": true,
                    "attachedToRef": "_3",
                    "isTimerEvent": true
                },
                "_4": {
                    "bpmnId": "_4",
                    "name": null,
                    "type": "sequenceFlow",
                    "sourceRef": "_2",
                    "targetRef": "_3",
                    "isSequenceFlow": true
                },
                "_8": {
                    "bpmnId": "_8",
                    "name": null,
                    "type": "sequenceFlow",
                    "sourceRef": "_7",
                    "targetRef": "_5",
                    "isSequenceFlow": true
                }
            },
            "sequenceFlowBySourceIndex": null,
            "nameMap": null
        },
        "testParseBPMNTimeout");
    test.done();
};
