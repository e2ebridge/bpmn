/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var fs = require('fs');

exports.testParseBPMNAllTasks = function(test) {

    var bpmnFilePath = "test/resources/bpmn/allTasks.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    var bpmnProcessDefinitions = bpmnParser.parse(bpmnXML, null, "AllTasks");
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
                "messageFlows": [],
                "processElementIndex": null,
                "sequenceFlowBySourceIndex": null,
                "sequenceFlowByTargetIndex": null,
                "messageFlowBySourceIndex": null,
                "messageFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true,
                "collaboratingParticipants": []
            }
        ],
        "testParseBPMNAllTasks");
    test.done();
};
