/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');

exports.testParseBPMNCallActivity = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/callActivity.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "CallActivity",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_5",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_8",
                        "name": "My Call Activity",
                        "type": "callActivity",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isCallActivity": true,
                        "calledElementName": "MyTaskExampleProcess",
                        "calledElementNamespace": "http://sourceforge.net/bpmn/definitions/_1363693864276",
                        "location": "taskExampleProcess.bpmn"
                    },
                    {
                        "bpmnId": "GT_1",
                        "name": "Global Task",
                        "type": "globalTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "waitForTaskDoneEvent": false
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_10",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_8",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_11",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_8",
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
        "testParseBPMNCallActivity");
    test.done();
};
