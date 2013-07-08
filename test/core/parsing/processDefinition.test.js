/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

exports.testProcessDefinitionsAPI = function(test) {

    var startEventObject = new BPMNStartEvent("_2", "MyStart", "startEvent");
    var endEventObject = new BPMNEndEvent("_5", "MyEnd", "endEvent");
    
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(startEventObject);
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(endEventObject);
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var hasOutgoingSequenceFlows1 = processDefinition.hasOutgoingSequenceFlows(startEventObject);
    test.ok(hasOutgoingSequenceFlows1, "testProcessDefinitionsAPI: hasOutgoingSequenceFlows: true");

    var hasOutgoingSequenceFlows2 = processDefinition.hasOutgoingSequenceFlows(endEventObject);
    test.ok(!hasOutgoingSequenceFlows2, "testProcessDefinitionsAPI: hasOutgoingSequenceFlows: false");

    var flowObject = processDefinition.getProcessElement("_3");
    test.deepEqual(flowObject,
        {
            "bpmnId": "_3",
            "name": "MyTask",
            "type": "task",
            "isFlowObject": true,
            "isActivity": true,
            "isWaitTask": true
        },
        "testProcessDefinitionsAPI: getProcessElement");

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
        "testProcessDefinitionsAPI: getNextFlowObjects");

    test.done();
};