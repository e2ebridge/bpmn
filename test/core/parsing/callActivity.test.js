/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var path = require('path');
var fs = require('fs');

exports.testParseBPMNCallActivity = function(test) {

    var bpmnFilePath = "test/resources/bpmn/callActivity.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    var bpmnProcessDefinitions = bpmnParser.parse(bpmnXML, null, "CallActivity", bpmnFilePath);
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
												"location": path.join("test", "resources", "bpmn","task.bpmn")
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
        "testParseBPMNCallActivity");
    test.done();
};
