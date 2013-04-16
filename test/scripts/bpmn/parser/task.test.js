/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');

exports.testParseBPMNTask = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/taskExampleProcess.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
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
                        "waitForTaskDoneEvent": true
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
                "processElementIndex": null,
                "sequenceFlowBySourceIndex": null,
                "sequenceFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null
            }
        ],
        "testParseBPMNTask");
    test.done();
};
