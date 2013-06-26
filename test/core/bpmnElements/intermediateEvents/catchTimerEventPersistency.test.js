/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var fileUtilsModule = require('../../../../lib/utils/file.js');
var publicModule = require('../../../../lib/public.js');
var bpmnProcessModule = require('../../../../lib/process.js');
var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
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

var persistencyPath = pathModule.join(__dirname, '../../../resources/persistency/testPersistentIntermediateTimerEvent');

exports.testBPMNCatchTimerEventPersistency_Save = function(test) {
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
            test.ok(error === null, "testBPMNCatchTimerEventPersistency_Save: no error saving.");

            test.equal(savedData.pendingTimeouts["MyCatchTimerEvent"].timeout, 1000000,
                "testBPMNCatchTimerEventPersistency_Save: saved timeout."
            );

            bpmnProcess.pendingTimerEvents.removeTimeout("MyCatchTimerEvent");

            test.done();
        }
    };

    fileUtilsModule.cleanDirectorySync(persistencyPath);
    publicModule.clearCache();

    var persistency = new Persistency({path: persistencyPath});
    bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstProcess", processDefinition, handler, persistency);
    //bpmnProcess.setLogLevel(publicModule.logLevels.debug);
    bpmnProcess.triggerEvent("MyStart");
};


exports.testBPMNCatchTimerEventPersistency_Load = function(test) {
    var bpmnProcess;

    var handler = {
        "MyCatchTimerEvent$getTimeout": function() {
            test.ok(bpmnProcess.pendingTimerEvents.pendingTimeouts["MyCatchTimerEvent"] === undefined,
                "testBPMNCatchTimerEventPersistency_Load: 'MyCatchTimerEvent$getTimeout': pendingTimeouts not yet defined"
            );
            return 1000000; // means: never
        },
        doneLoadingHandler: function(error, loadedData) {
            test.ok(error === null, "testBPMNCatchTimerEventPersistency_Load: no error loading.");

            test.equal(loadedData.pendingTimeouts["MyCatchTimerEvent"].timeout, 1000000,
                "testBPMNCatchTimerEventPersistency_Load: loaded timeout."
            );

            var pendingTimerEvents = bpmnProcess.pendingTimerEvents;
            test.ok(pendingTimerEvents !== undefined,
                "testBPMNCatchTimerEventPersistency_Load: created pendingTimerEvents."
            );

            test.ok(pendingTimerEvents.pendingTimeouts["MyCatchTimerEvent"] !== undefined,
                "testBPMNCatchTimerEventPersistency_Load: 'MyCatchTimerEvent$getTimeout': pendingTimeouts after loading"
            );

            test.equal(pendingTimerEvents.pendingTimeouts["MyCatchTimerEvent"].timeout, 1000000,
                "testBPMNCatchTimerEventPersistency_Load: added 'MyCatchTimerEvent' to pendingTimerEvents."
            );

            test.ok(pendingTimerEvents.setTimeoutIds["MyCatchTimerEvent"]._onTimeout !== undefined,
                "testBPMNCatchTimerEventPersistency_Load: created timers."
            );

            pendingTimerEvents.removeTimeout("MyCatchTimerEvent");

            test.done();
        }
    };

    publicModule.clearCache();

    var persistency = new Persistency({path: persistencyPath});
    bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstProcess", processDefinition, handler, persistency);
};
