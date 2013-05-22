/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');

exports.testParseBPMNAllTasks = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/allTasks.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "AllTasks",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Task",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "Send Task",
                        "type": "sendTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": false
                    },
                    {
                        "bpmnId": "_4",
                        "name": "Receive Task",
                        "type": "receiveTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "Service Task",
                        "type": "serviceTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": false
                    },
                    {
                        "bpmnId": "_8",
                        "name": "User Task",
                        "type": "userTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "Manual Task",
                        "type": "manualTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
                    },
                    {
                        "bpmnId": "_10",
                        "name": "Script Task",
                        "type": "scriptTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": false
                    },
                    {
                        "bpmnId": "_11",
                        "name": "Business Rule Task",
                        "type": "businessRuleTask",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": false
                    }
                ],
                "sequenceFlows": [],
                "processElementIndex": null,
                "sequenceFlowBySourceIndex": null,
                "sequenceFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true,
                "collaboratingParticipants": []
            }
        ],
        "testParseBPMNAllTasks");
    test.done();
};
