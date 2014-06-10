/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../../lib/process.js');

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../../lib/parsing/gateways.js").BPMNExclusiveGateway;

require("../../../../lib/history.js").setDummyTimestampFunction();

exports.testXorGateway = function(test) {
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "Start Event", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "First Task", "task"));
    processDefinition.addFlowObject(new BPMNTask("_7", "Task A", "task"));
    processDefinition.addFlowObject(new BPMNTask("_9", "Task B", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_11", "End Event A", "endEvent"));
    processDefinition.addFlowObject(new BPMNEndEvent("_12", "End Event B", "endEvent"));
    processDefinition.addFlowObject(new BPMNExclusiveGateway("_5", "Is it ok?", "exclusiveGateway"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_5"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", "nok", "sequenceFlow", "_5", "_7"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_10", "ok", "sequenceFlow", "_5", "_9"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_14", null, "sequenceFlow", "_7", "_11"));

    var log = function() {};

    var handler = {
        "Start_Event": function(data, done) {
            log("Start Event");
            done(data);
        },
        "First_Task": function(data, done) {
            log("First Task");
            done(data);
        },
        "First_TaskDone": function(data, done) {
            log("First TaskDone");
            done(data);
        },
        "Is_it_ok_": function(data, done) {
            log("Is it ok?");
            done(data);
        },
        "Is_it_ok_$ok": function() {
            log("Is it ok?:ok");
            return true;
        },
        "Is_it_ok_$nok": function() {
            log("Is it ok?:nok");
            return false;
        },
        "Task_A": function(data, done) {
            log("Task A");
            test.ok(false, "testXorGateway: reached Task A but expected B!");
            test.done();
            done(data);
        },
        "Task_ADone": function(data, done) {
            log("Task ADone");
            done(data);
        },
        "Task_B": function(data, done) {
            log("Task B");

            test.ok(true, "testXorGateway: reached Task B");

            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "Start Event",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "First Task",
                        "type": "task",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "Is it ok?",
                        "type": "exclusiveGateway",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "Task B",
                        "type": "task",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "testXorGateway: history at End Event B"
            );

            test.done();

            done(data);
        },
        "Task_BDone": function(data, done) {
            log("Task BDone");
            done(data);
        },
        "End_Event A": function(data, done) {
            log("End Event A");
            done(data);
        },
        "End_Event B": function(data, done) {
            log("End Event B");
            done(data);
        }
    };

    bpmnProcesses.createBPMNProcess("myFirstXGatewayProcess", processDefinition, handler, function(err, bpmnProcess){

        bpmnProcess.triggerEvent("Start Event");
        bpmnProcess.taskDone("First Task");

    });

};