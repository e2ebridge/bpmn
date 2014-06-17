/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var fs = require('fs');

exports.testParseAndMerge = function(test) {

    var bpmnFilePath = "test/resources/bpmn/andMerge.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    var bpmnProcessDefinitions = bpmnParser.parse(bpmnXML, null, "AndMerge");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "AndMerge",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event1",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "Start Event2",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "Parallel Converging Gateway",
                        "type": "parallelGateway",
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
        "testParseAndMerge");
    test.done();
};

exports.testParseAndGateway = function(test) {

    var bpmnFilePath = "test/resources/bpmn/andGateway.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    var bpmnProcesses = bpmnParser.parse(bpmnXML, null, "AndGateway");
    test.deepEqual(bpmnProcesses,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "AndGateway",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "Parallel Gateway",
                        "type": "parallelGateway",
                        "isFlowObject": true,
                        "isParallelGateway": true
                    },
                    {
                        "bpmnId": "_5",
                        "name": "Task A",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
                    },
                    {
                        "bpmnId": "_6",
                        "name": "Task B",
                        "type": "task",
                        "isFlowObject": true,
                        "isActivity": true,
                        "isWaitTask": true
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
        "testParseAndGateway");
    test.done();
};
