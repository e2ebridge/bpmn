/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var processDefinitionModule = require('../../../lib/bpmn/processDefinition.js');

function getMockupProcessDefinition() {

    /** @type {BPMNProcessDefinition} */
    var process = new processDefinitionModule.BPMNProcessDefinition("PROCESS_1", "myProcess");
    process.addTask({
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
    });
    process.addStartEvent({
        "bpmnId": "_2",
        "name": "MyStart",
        "type": "startEvent",
        "outgoingRefs": [
            "_4"
        ],
        "incomingRefs": []
    });
    process.addEndEvent({
        "bpmnId": "_5",
        "name": "MyEnd",
        "type": "endEvent",
        "outgoingRefs": [],
        "incomingRefs": [
            "_6"
        ]
    });
    process.addSequenceFlow({
        "bpmnId": "_4",
        "name": "flow1",
        "type": "sequenceFlow",
        "sourceRef": "_2",
        "targetRef": "_3"
    });
    process.addSequenceFlow({
        "bpmnId": "_6",
        "name": "flow2",
        "type": "sequenceFlow",
        "sourceRef": "_3",
        "targetRef": "_5"
    });

    return process;
}

exports.testGetFlowObject = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = getMockupProcessDefinition();

    var flowObject = processDefinition.getProcessElement("_3");
    test.deepEqual(flowObject,
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
        },
        "testGetFlowObject");

    var nextFlowObjects = processDefinition.getNextFlowObjects(flowObject);
    test.deepEqual(nextFlowObjects,
        [
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
        "testGetNextFlowObjects");

    test.done();
};