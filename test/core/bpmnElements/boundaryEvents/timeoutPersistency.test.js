/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var fileUtils = require('../../../../lib/utils/file.js');
var bpmn = require('../../../../lib/public.js');
var bpmnProcesses = require('../../../../lib/process.js');

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNBoundaryEvent = require("../../../../lib/parsing/boundaryEvents.js").BPMNBoundaryEvent;
var Persistency = require('../../../../lib/persistency/persistency.js').Persistency;

var boundaryEvent = new BPMNBoundaryEvent("_7", "MyTimeout", "boundaryEvent", "_3");
boundaryEvent.isTimerEvent = true;

/** @type {BPMNProcessDefinition} */
var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
processDefinition.addFlowObject(boundaryEvent);
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", null, "sequenceFlow", "_2", "_3"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_8", null, "sequenceFlow", "_7", "_5"));

var persistencyUri = path.join(__dirname, '../../../resources/persistency/testPersistentTimeout');

exports.testBPMNTimeoutPersistencySave = function(test) {
    var bpmnProcess;

    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MyTask": function(data, done) {
            done(data);
        },
        "MyTimeout$getTimeout": function() {
            return 1000000; // means: never
        },
        "MyTimeout": function(data, done) {
             done(data);
        },
        doneSavingHandler: function(error, savedData) {
            test.ok(error === null, "testBPMNTimeoutPersistencySave: no error saving.");

            test.equal(savedData.pendingTimeouts.MyTimeout.timeout, 1000000, "testBPMNTimeoutPersistencySave: saved timeout.");

            bpmnProcess.pendingTimerEvents.removeTimeout("MyTimeout");

            test.done();
        }
    };

    fileUtils.cleanDirectorySync(persistencyUri);
    bpmn.clearCache();

    var persistency = new Persistency({uri: persistencyUri});
    bpmnProcesses.createBPMNProcess("myFirstProcess", processDefinition, handler, persistency, function(err, process){
        bpmnProcess = process;

        bpmnProcess.triggerEvent("MyStart");
    });
};


exports.testBPMNTimeoutPersistencyLoad = function(test) {

    var handler = {
        "MyTimeout$getTimeout": function() {
            test.ok(this._implementation.pendingTimerEvents.pendingTimeouts.MyTimeout === undefined,
                "testBPMNTimeoutPersistencyLoad: 'MyTimeout$getTimeout': pendingTimeouts not yet defined"
            );
            return 1000000; // means: never
        },
        doneLoadingHandler: function(error, loadedData) {
            test.ok(error === null, "testBPMNTimeoutPersistencyLoad: no error loading.");

            test.equal(loadedData.pendingTimeouts.MyTimeout.timeout, 1000000,
                "testBPMNTimeoutPersistencyLoad: loaded timeout."
            );
        }
    };

    bpmn.clearCache();

    var persistency = new Persistency({uri: persistencyUri});
    bpmnProcesses.createBPMNProcess("myFirstProcess", processDefinition, handler, persistency, function(err, bpmnProcess){

        var pendingTimerEvents = bpmnProcess.pendingTimerEvents;
        test.ok(pendingTimerEvents !== undefined,
            "testBPMNTimeoutPersistencyLoad: created pendingTimerEvents."
        );

        test.ok(pendingTimerEvents.pendingTimeouts.MyTimeout !== undefined,
            "testBPMNTimeoutPersistencyLoad: 'MyTimeout$getTimeout': pendingTimeouts after loading"
        );

        test.equal(pendingTimerEvents.pendingTimeouts.MyTimeout.timeout, 1000000,
            "testBPMNTimeoutPersistencyLoad: added 'MyTimeout' to pendingTimerEvents."
        );

        test.ok(pendingTimerEvents.setTimeoutIds.MyTimeout._onTimeout !== undefined,
            "testBPMNTimeoutPersistencyLoad: created timers."
        );

        pendingTimerEvents.removeTimeout("MyTimeout");

        test.done();
    });
};
