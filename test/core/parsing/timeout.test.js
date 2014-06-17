/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var fs = require('fs');

exports.testParseBPMNTimeout = function(test) {

    var bpmnFilePath = "test/resources/bpmn/timeout.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    var bpmnProcessDefinitions = bpmnParser.parse(bpmnXML, null, "Timeout");
    test.equal(bpmnProcessDefinitions.length, 1, "testParseBPMNTimeout: number of processDefinitions");
    var bpmnProcessDefinition = bpmnProcessDefinitions[0];

    test.deepEqual(bpmnProcessDefinition,
        {
            "bpmnId": "PROCESS_1",
            "name": "Timeout",
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
                    "isWaitTask": true
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
                    "name": "MyTimeout",
                    "type": "boundaryEvent",
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
        },
        "testParseBPMNTimeout");
    test.done();
};
