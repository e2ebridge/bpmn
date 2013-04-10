/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');
var errorsModule = require('../../../../lib/errors.js');

exports.testParseBPMNTask = function(test) {

    var bpmnObject = bpmnParserModule.parse("test/resources/bpmn/taskExampleProcess.bpmn");
    test.deepEqual(bpmnObject,
        [
            {
                "bpmnId": "PROCESS_1",
                "name": "TaskExampleProcess",
                "tasks": [
                    {
                        "bpmnId": "_3",
                        "name": "MyTask",
                        "type": "task",
                        "outgoingRefs": [
                            "_6"
                        ],
                        "incomingRefs": [
                            "_4"
                        ],
                        "waitForTaskDoneEvent": true
                    }
                ],
                "startEvents": [
                    {
                        "bpmnId": "_2",
                        "name": "MyStart",
                        "type": "startEvent",
                        "outgoingRefs": [
                            "_4"
                        ],
                        "incomingRefs": []
                    }
                ],
                "endEvents": [
                    {
                        "bpmnId": "_5",
                        "name": "MyEnd",
                        "type": "endEvent",
                        "outgoingRefs": [],
                        "incomingRefs": [
                            "_6"
                        ]
                    }
                ],
                "sequenceFlows": [
                    {
                        "bpmnId": "_4",
                        "name": "flow1",
                        "type": "sequenceFlow",
                        "sourceRef": "_2",
                        "targetRef": "_3"
                    },
                    {
                        "bpmnId": "_6",
                        "name": "flow2",
                        "type": "sequenceFlow",
                        "sourceRef": "_3",
                        "targetRef": "_5"
                    }
                ],
                "gateways": [],
                "processElementIndex": null,
                "nameMap": null
            }
        ],
        "testParseBPMNTask");
    test.done();
};
