/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');

exports.testParseBPMNAllEndEvents = function(test) {

    var bpmnProcessDefinitions = bpmnParserModule.parse("test/resources/bpmn/allEndEvents.bpmn");
    test.deepEqual(bpmnProcessDefinitions,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "AllEndEvents",
                "flowObjects": [
                    {
                        "bpmnId": "_2",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true,
                        "isMessageEvent": true
                    },
                    {
                        "bpmnId": "_3",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_4",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_5",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_6",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_7",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_8",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
                    },
                    {
                        "bpmnId": "_9",
                        "name": "End Event",
                        "type": "endEvent",
                        "isFlowObject": true,
                        "isEndEvent": true
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
        "testParseBPMNAllEndEvents");
    test.done();
};
