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
var BPMNBoundaryEvent = require("../../../../lib/parsing/boundaryEvents.js").BPMNBoundaryEvent;
var Persistency = require('../../../../lib/persistency.js').Persistency;

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

var persistencyPath = pathModule.join(__dirname, '../../../resources/persistency/testPersistentTimeout');

exports.testBPMNTimeoutPersistency_Save = function(test) {
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
            test.ok(error === null, "testBPMNTimeoutPersistency_Save: no error saving.");

            test.equal(savedData.pendingTimeouts["MyTimeout"].timeout, 1000000, "testBPMNTimeoutPersistency_Save: saved timeout.");

            bpmnProcess.pendingTimerEvents.removeTimeout("MyTimeout");

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


exports.testBPMNTimeoutPersistency_Load = function(test) {
    var bpmnProcess;

    var handler = {
        "MyTimeout$getTimeout": function() {
            test.ok(bpmnProcess.pendingTimerEvents.pendingTimeouts["MyTimeout"] === undefined,
                "testBPMNTimeoutPersistency_Load: 'MyTimeout$getTimeout': pendingTimeouts not yet defined"
            );
            return 1000000; // means: never
        },
        doneLoadingHandler: function(error, loadedData) {
            test.ok(error === null, "testBPMNTimeoutPersistency_Load: no error loading.");

            test.equal(loadedData.pendingTimeouts["MyTimeout"].timeout, 1000000,
                "testBPMNTimeoutPersistency_Load: loaded timeout."
            );

            var pendingTimerEvents = bpmnProcess.pendingTimerEvents;
            test.ok(pendingTimerEvents !== undefined,
                "testBPMNTimeoutPersistency_Load: created pendingTimerEvents."
            );

            test.ok(pendingTimerEvents.pendingTimeouts["MyTimeout"] !== undefined,
                "testBPMNTimeoutPersistency_Load: 'MyTimeout$getTimeout': pendingTimeouts after loading"
            );

            test.equal(pendingTimerEvents.pendingTimeouts["MyTimeout"].timeout, 1000000,
                "testBPMNTimeoutPersistency_Load: added 'MyTimeout' to pendingTimerEvents."
            );

            test.ok(pendingTimerEvents.setTimeoutIds["MyTimeout"]._onTimeout !== undefined,
                "testBPMNTimeoutPersistency_Load: created timers."
            );

            pendingTimerEvents.removeTimeout("MyTimeout");

            test.done();
        }
    };

    publicModule.clearCache();

    var persistency = new Persistency({path: persistencyPath});
    bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstProcess", processDefinition, handler, persistency);
};
