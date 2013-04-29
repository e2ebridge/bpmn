/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');

exports.testParseBPMNServiceTask = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/serviceTask.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "MyTaskExampleProcess",
                "name": "ServiceTask",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "MyStart",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_5",
                        "name": "MyEnd",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "Service Task",
                        "type": "serviceTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitActivity": false
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_8",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_7",
                        "isSequenceFlow": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": null,
                        "type": "sequenceFlow",
                        "sourceRef": "_7",
                        "targetRef": "_5",
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
        "testParseBPMNServiceTask");
    test.done();
};
