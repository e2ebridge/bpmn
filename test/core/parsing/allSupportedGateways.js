/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var fs = require('fs');

exports.testParseBPMNAllSupportedGateways = function(test) {

    var bpmnFilePath = "test/resources/bpmn/allSupportedGateways.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    var bpmnProcessDefinitions = bpmnParser.parse(bpmnXML, null, "AllSupportedGateways");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "AllSupportedGateways",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "Exclusive Gateway",
                        "type": "exclusiveGateway",
                        "isFlowObject": true,
                        "isExclusiveGateway": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "Exclusive Gateway",
                        "type": "exclusiveGateway",
                        "isFlowObject": true,
                        "isExclusiveGateway": true
                    },
                    {
                        "bpmnId": "_4",
                        "name": "Parallel Gateway",
                        "type": "parallelGateway",
                        "isFlowObject": true,
                        "isParallelGateway": true
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
        "testParseBPMNAllSupportedGateways");
    test.done();
};
