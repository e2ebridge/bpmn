/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../lib/process.js');

var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNBoundaryEvent = require("../../../lib/parsing/boundaryEvents.js").BPMNBoundaryEvent;

var logLevels = require('../../../lib/public.js').logLevels;

require("../../../lib/history.js").setDummyTimestampFunction();

exports.testIncorrectTaskDoneEvent = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addFlowObject(new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));

    var bpmnProcess;

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyStart",
                        "owningProcessId": "myFirstProcess"
                    }
                ],
                "testIncorrectTaskDoneEvent: state at MyStart"
            );

            bpmnProcess.setLogLevel(logLevels.none);
            bpmnProcess.taskDone("MyTask");

            // NOTE: IF we called test.done() we would continue to MyTask!
            // TODO_CONTINUE: do we want to do this?
            //done(data);
        },
        "MyTask": function(data, done) {
            test.ok(false, "testIncorrectTaskDoneEvent: we should never reach the MyTask handler.");
            test.done();
            done(data);
        },
        "MyTaskDone": function(data, done) {
            test.ok(false, "testIncorrectTaskDoneEvent: we should never reach the MyTaskDone handler.");
            test.done();
            done(data);
        },
        "defaultEventHandler": function(eventType, flowObjectName, handlerName, reason) {
            test.equal(eventType, "ACTIVITY_END_EVENT", "testIncorrectTaskDoneEvent: defaultEventHandler: eventType");
            test.equal(flowObjectName, "MyTask", "testIncorrectTaskDoneEvent: defaultEventHandler: flowObjectName");
            test.equal(handlerName, "MyTaskDone", "testIncorrectTaskDoneEvent: defaultEventHandler: handlerName");
            test.equal(reason, "Process cannot handle this activity because it is not currently executed.",
                "testIncorrectTaskDoneEvent: defaultEventHandler: reason");

            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "testIncorrectTaskDoneEvent: history in defaultEventHandler"
            );

            test.done();
        }
    };

    bpmnProcesses.createBPMNProcess("myFirstProcess", processDefinition, handler, function(err, process){

        bpmnProcess = process;

        bpmnProcess.triggerEvent("MyStart");

    });

};