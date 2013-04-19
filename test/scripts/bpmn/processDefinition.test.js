/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessDefinitionModule = require('../../../lib/bpmn/processDefinition.js');
var BPMNProcessDefinition = bpmnProcessDefinitionModule.BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var pathModule = require('path');

exports.testLoadBPMNProcessDefinition = function(test) {
    var fileName = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    bpmnProcessDefinitionModule.clearProcessDefinitionCache();
    var processes = bpmnProcessDefinitionModule.getBPMNProcessDefinition(fileName);
    test.deepEqual(processes,
        {
            "bpmnId": "PROCESS_1",
            "name": "TaskExampleProcess",
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
                    "isWaitActivity": true
                },
                {
                    "bpmnId": "_5",
                    "name": "MyEnd",
                    "type": "endEvent",
                    "isFlowObject": true,
                    "isEndEvent": true
                }
            ],
            "sequenceFlows": [
                {
                    "bpmnId": "_4",
                    "name": "flow1",
                    "type": "sequenceFlow",
                    "sourceRef": "_2",
                    "targetRef": "_3",
                    "isSequenceFlow": true
                },
                {
                    "bpmnId": "_6",
                    "name": "flow2",
                    "type": "sequenceFlow",
                    "sourceRef": "_3",
                    "targetRef": "_5",
                    "isSequenceFlow": true
                }
            ],
            "processElementIndex": null,
            "sequenceFlowBySourceIndex": null,
            "sequenceFlowByTargetIndex": null,
            "boundaryEventsByAttachmentIndex": null,
            "nameMap": null
        },
        "testLoadBPMNProcessDefinition");

    test.done();
};

exports.testGetFlowObject = function(test) {

    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var flowObject = processDefinition.getProcessElement("_3");
    test.deepEqual(flowObject,
        {
            "bpmnId": "_3",
            "name": "MyTask",
            "type": "task",
            "isFlowObject": true,
            "isActivity": true,
            "isWaitActivity": true
        },
        "testGetFlowObject");

    var nextFlowObjects = processDefinition.getNextFlowObjects(flowObject);
    test.deepEqual(nextFlowObjects,
        [
            {
                "bpmnId": "_5",
                "name": "MyEnd",
                "type": "endEvent",
                "isFlowObject": true,
                "isEndEvent": true
            }
        ],
        "testGetNextFlowObjects");

    test.done();
};