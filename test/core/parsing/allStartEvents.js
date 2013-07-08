/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');

exports.testParseBPMNAllStartEvents = function(test) {

    var bpmnProcessDefinitions = bpmnParser.parse("test/resources/bpmn/allStartEvents.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "AllStartEvents",
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
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true,
                        "isMessageEvent": true
                    },
                    {
                        "bpmnId": "_4",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true,
                        "isTimerEvent": true
                    },
                    {
                        "bpmnId": "_5",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_6",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
                    },
                    {
                        "bpmnId": "_8",
                        "name": "Start Event",
                        "type": "startEvent",
                        "isFlowObject": true,
                        "isStartEvent": true
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
        "testParseBPMNAllStartEvents");
    test.done();
};
