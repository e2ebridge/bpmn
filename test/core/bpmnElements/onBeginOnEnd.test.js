/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../lib/process.js');
var path = require('path');

var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNCallActivity = require("../../../lib/parsing/callActivity.js").BPMNCallActivity;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

require("../../../lib/history.js").setDummyTimestampFunction();

exports.testOnBeginOnEndHandler = function(test) {
    var mainProcess;
    var bpmnCalledProcessFileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "MyProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyMainStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNCallActivity("_3", "MyCallActivity", "callActivity",
        "MyTaskExampleProcess", "http://sourceforge.net/parsing/definitions/_1363693864276", bpmnCalledProcessFileName));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyMainEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var onBeginTrace = "";
    var onEndTrace = "";

    var handler = {
        "onBeginHandler":  function(currentFlowObjectName, data, done) {
            onBeginTrace += "::" + currentFlowObjectName;
            done(data);
        },
        "onEndHandler":  function(currentFlowObjectName, data, done) {
            onEndTrace += "::" + currentFlowObjectName;
            done(data);
        },
        "MyMainStart": function(data, done) {
            done(data);
        },
        "MyCallActivity": {
            "MyStart": function(data, done) {
                done(data);
            },
            "MyTask": function(data, done) {
                mainProcess.taskDone("MyTask");
                done(data);
            },
            "MyTaskDone": function(data, done) {
                done(data);
            },
            "MyEnd": function(data, done) {
                done(data);
            }
        },
        "MyCallActivityDone": function(data, done) {
            done(data);
        },
        "MyMainEnd": function(data, done) {
            done(data);
            test.equal(onBeginTrace, "::MyMainStart::MyCallActivity::MyStart::MyTask::MyEnd::MyMainEnd", "testOnBeginOnEndHandler: onBeginTrace");
            test.equal(onEndTrace, "::MyMainStart::MyStart::MyTask::MyEnd::MyCallActivity::MyMainEnd", "testOnBeginOnEndHandler: onEndTrace");
            test.done();
        }
    };

    bpmnProcesses.createBPMNProcess("mainPid1", processDefinition, handler, function(err, bpmnProcess){
        mainProcess = bpmnProcess;
        mainProcess.triggerEvent("MyMainStart");
    });


};