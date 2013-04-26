/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');

exports.testParseBPMNAllSupportedGateways = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/allSupportedGateways.bpmn");
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
                "processElementIndex": null,
                "sequenceFlowBySourceIndex": null,
                "sequenceFlowByTargetIndex": null,
                "boundaryEventsByAttachmentIndex": null,
                "nameMap": null,
                "isProcessDefinition": true,
                "isProcessDefinition": true
            }
        ],
        "testParseBPMNAllSupportedGateways");
    test.done();
};
