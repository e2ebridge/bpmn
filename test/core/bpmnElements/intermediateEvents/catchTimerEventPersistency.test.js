/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var fileUtils = require('../../../../lib/utils/file.js');
var bpmn = require('../../../../lib/public.js');
var bpmnProcesses = require('../../../../lib/process.js');

var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNIntermediateCatchEvent = require("../../../../lib/parsing/intermediateEvents.js").BPMNIntermediateCatchEvent;
var Persistency = require('../../../../lib/persistency/persistency.js').Persistency;

/** @type {BPMNProcessDefinition} */
var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));

var catchTimerEventElement = new BPMNIntermediateCatchEvent("_3", "MyCatchTimerEvent", "intermediateCatchEvent");
catchTimerEventElement.isTimerEvent = true;
processDefinition.addFlowObject(catchTimerEventElement);

processDefinition.addFlowObject(new BPMNEndEvent("_4", "MyEnd", "endEvent"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_5", null, "sequenceFlow", "_2", "_3"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", null, "sequenceFlow", "_3", "_4"));

var persistencyUri = path.join(__dirname, '../../../resources/persistency/testPersistentIntermediateTimerEvent');

exports.testBPMNCatchTimerEventPersistencySave = function(test) {
    var bpmnProcess;

    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MyCatchTimerEvent$getTimeout": function() {
            return 1000000; // means: never
        },
        "MyCatchTimerEvent": function(data, done) {
             done(data);
        },
        doneSavingHandler: function(error, savedData) {
            test.ok(error === null, "testBPMNCatchTimerEventPersistencySave: no error saving.");

            test.equal(savedData.pendingTimeouts.MyCatchTimerEvent.timeout, 1000000,
                "testBPMNCatchTimerEventPersistencySave: saved timeout."
            );

            bpmnProcess.pendingTimerEvents.removeTimeout("MyCatchTimerEvent");

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


exports.testBPMNCatchTimerEventPersistencyLoad = function(test) {

    var handler = {
        "MyCatchTimerEvent$getTimeout": function() {
            test.ok(this._implementation.pendingTimerEvents.pendingTimeouts.MyCatchTimerEvent === undefined,
                "testBPMNCatchTimerEventPersistencyLoad: 'MyCatchTimerEvent$getTimeout': pendingTimeouts not yet defined"
            );
            return 1000000; // means: never
        },
        doneLoadingHandler: function(error, loadedData) {
            test.ok(error === null, "testBPMNCatchTimerEventPersistencyLoad: no error loading.");

            test.equal(loadedData.pendingTimeouts.MyCatchTimerEvent.timeout, 1000000,
                "testBPMNCatchTimerEventPersistencyLoad: loaded timeout."
            );
        }
    };

    bpmn.clearCache();

    var persistency = new Persistency({uri: persistencyUri});
    bpmnProcesses.createBPMNProcess("myFirstProcess", processDefinition, handler, persistency, function(err, bpmnProcess){

        var pendingTimerEvents = bpmnProcess.pendingTimerEvents;
        test.ok(pendingTimerEvents !== undefined,
            "testBPMNCatchTimerEventPersistencyLoad: created pendingTimerEvents."
        );

        test.ok(pendingTimerEvents.pendingTimeouts.MyCatchTimerEvent !== undefined,
            "testBPMNCatchTimerEventPersistencyLoad: 'MyCatchTimerEvent$getTimeout': pendingTimeouts after loading"
        );

        test.equal(pendingTimerEvents.pendingTimeouts.MyCatchTimerEvent.timeout, 1000000,
            "testBPMNCatchTimerEventPersistencyLoad: added 'MyCatchTimerEvent' to pendingTimerEvents."
        );

        test.ok(pendingTimerEvents.setTimeoutIds.MyCatchTimerEvent._onTimeout !== undefined,
            "testBPMNCatchTimerEventPersistencyLoad: created timers."
        );

        pendingTimerEvents.removeTimeout("MyCatchTimerEvent");

        test.done();
    });
};
