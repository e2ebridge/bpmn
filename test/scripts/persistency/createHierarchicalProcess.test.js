/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var fileUtilsModule = require('../../../lib/utils/file.js');
var bpmnProcessModule = require('../../../lib/process.js');
var Persistency = require('../../../lib/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/parsing/tasks.js").BPMNTask;
var BPMNCallActivity = require("../../../lib/parsing/callActivity.js").BPMNCallActivity;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

var bpmnCalledProcessFileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
var persistencyPath = './test/resources/persistency/testHierarchicalProcess';
var persistency = new Persistency({path: persistencyPath});

var processDefinition = new BPMNProcessDefinition("PROCESS_1", "MyProcess");
processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
processDefinition.addFlowObject(new BPMNCallActivity("_3", "MyCallActivity", "callActivity",
    "MyTaskExampleProcess", "http://sourceforge.net/parsing/definitions/_1363693864276", bpmnCalledProcessFileName));
processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

exports.testCreatePersistentHierarchicalProcess = function(test) {
    var mainProcess;
    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MyCallActivity": { // calledProcess handler start here
            "MyStart": function(data, done) {
                done(data);
            },
            "MyTask": function(data, done) {
                done(data);
            },
            "MyTaskDone": function(data, done) {
                done(data);
            },
            "MyEnd":function(data, done) {
                done(data);
            }
        },
        "MyCallActivityDone": function(data, done) {
            done(data);
        },
        "MyEnd": function(data, done) {
            compareHistoryEntryAtEndOfProcess(this, test);
            testProcessRemovalFromCache(mainProcess, done, test);

            test.done();
        }
    };

    fileUtilsModule.cleanDirectorySync(persistencyPath);

    handler.doneSavingHandler = function(error, savedData) {
        test.ok(error === null, "testCreatePersistentHierarchicalProcess: no error saving.");

        compareSavedStateAtMyTask(mainProcess, savedData, test);

        mainProcess.loadPersistedData();
    };

    handler.doneLoadingHandler = function(error, loadedData) {
        test.ok(error === undefined || error === null, "testCreatePersistentHierarchicalProcess: no error loading.");

        compareLoadedStateAtMyTask(mainProcess, loadedData, test);

        var calledProcessId = "mainPid1::MyCallActivity";
        var calledProcess = mainProcess.calledProcesses[calledProcessId];
        calledProcess.taskDone("MyTask");
    };

    mainProcess = bpmnProcessModule.createBPMNProcess4Testing("mainPid1", processDefinition, handler, persistency);
    mainProcess.triggerEvent("MyStart");
};

function testProcessRemovalFromCache(mainProcess, done, test) {
    var mainProcessFromCacheBEFOREDoneHandler = bpmnProcessModule.getFromCache(mainProcess.processId);
    test.ok(mainProcessFromCacheBEFOREDoneHandler !== undefined, "testCreatePersistentHierarchicalProcess: before handler done() call: is process in cache.");

    done();

    var mainProcessFromCacheAFTERDoneHandler = bpmnProcessModule.getFromCache(mainProcess.processId);
    test.ok(mainProcessFromCacheAFTERDoneHandler === undefined, "testCreatePersistentHierarchicalProcess: after handler done() call: is process in cache.");
}

function compareHistoryEntryAtEndOfProcess(mainProcess, test) {
    var history = mainProcess.getHistory();
    test.deepEqual(history.historyEntries,
        [
            {
                "name": "MyStart"
            },
            {
                "name": "MyCallActivity",
                "subhistory": {
                    "historyEntries": [
                        {
                            "name": "MyStart"
                        },
                        {
                            "name": "MyTask"
                        },
                        {
                            "name": "MyEnd"
                        }
                    ]
                }
            },
            {
                "name": "MyEnd"
            }
        ],
        "testSimpleBPMNProcess: history at MyEnd of main process"
    );
}

function compareSavedStateAtMyTask(mainProcess, savedData, test) {
    var state = mainProcess.getState();
    test.deepEqual(state.tokens,
        [
            {
                "position": "MyCallActivity",
                "substate": {
                    "tokens": [
                        {
                            "position": "MyTask",
                            "owningProcessId": "mainPid1::MyCallActivity"
                        }
                    ]
                },
                "calledProcessId": "mainPid1::MyCallActivity",
                "owningProcessId": "mainPid1"
            }
        ],
        "testCreatePersistentHierarchicalProcess: state at MyTask."
    );

    test.ok(savedData._saved !== undefined, "testCreatePersistentHierarchicalProcess: saving: _saved exists");
    savedData._saved = "FIXEDTIMESTAMP4TESTING";

    test.ok(savedData._updated !== undefined, "testCreatePersistentHierarchicalProcess: saving: _updated exists");
    savedData._updated = "FIXEDTIMESTAMP4TESTING";

    test.deepEqual(savedData,
        {
            "processName": "MyProcess",
            "processId": "mainPid1",
            "parentToken": null,
            "data": {},
            "state": {
                "tokens": [
                    {
                        "position": "MyCallActivity",
                        "owningProcessId": "mainPid1",
                        "substate": {
                            "tokens": [
                                {
                                    "position": "MyTask",
                                    "owningProcessId": "mainPid1::MyCallActivity"
                                }
                            ]
                        },
                        "calledProcessId": "mainPid1::MyCallActivity"
                    }
                ]
            },
            "history": {
                "historyEntries": [
                    {
                        "name": "MyStart"
                    },
                    {
                        "name": "MyCallActivity",
                        "subhistory": {
                            "historyEntries": [
                                {
                                    "name": "MyStart"
                                },
                                {
                                    "name": "MyTask"
                                }
                            ]
                        }
                    }
                ]
            },
            "eventName2TimeoutMap": {},
            "_id": 1,
            "_saved": "FIXEDTIMESTAMP4TESTING",
            "_updated": "FIXEDTIMESTAMP4TESTING"
        },
        "testCreatePersistentHierarchicalProcess: savedData."
    );
}

function compareLoadedStateAtMyTask(mainProcess, loadedData, test) {
    var mainState = mainProcess.getState();

    test.deepEqual(mainState.tokens,
        [
            {
                "position": "MyCallActivity",
                "substate": {
                    "tokens": [
                        {
                            "position": "MyTask",
                            "owningProcessId": "mainPid1::MyCallActivity"
                        }
                    ]
                },
                "owningProcessId": "mainPid1",
                "calledProcessId": "mainPid1::MyCallActivity"
            }
        ],
        "testCreatePersistentHierarchicalProcess: afterLoading: process tokens"
    );

    test.ok(loadedData._saved !== undefined, "testCreatePersistentHierarchicalProcess: loading: _saved exists");
    loadedData._saved = "FIXEDTIMESTAMP4TESTING";

    test.ok(loadedData._updated !== undefined, "testCreatePersistentHierarchicalProcess: loading: _updated exists");
    loadedData._updated = "FIXEDTIMESTAMP4TESTING";

    test.deepEqual(loadedData,
        {
            "processName": "MyProcess",
            "processId": "mainPid1",
            "parentToken": null,
            "data": {},
            "state": {
                "tokens": [
                    {
                        "position": "MyCallActivity",
                        "substate": {
                            "tokens": [
                                {
                                    "position": "MyTask",
                                    "owningProcessId": "mainPid1::MyCallActivity"
                                }
                            ]
                        },
                        "owningProcessId": "mainPid1",
                        "calledProcessId": "mainPid1::MyCallActivity"
                    }
                ]
            },
            "history": {
                "historyEntries": [
                    {
                        "name": "MyStart"
                    },
                    {
                        "name": "MyCallActivity",
                        "subhistory": {
                            "historyEntries": [
                                {
                                    "name": "MyStart"
                                },
                                {
                                    "name": "MyTask"
                                }
                            ]
                        }
                    }
                ]
            },
            "eventName2TimeoutMap": {},
            "_id": 1,
            "_saved": "FIXEDTIMESTAMP4TESTING",
            "_updated": "FIXEDTIMESTAMP4TESTING"
        },
        "testCreatePersistentHierarchicalProcess: loadedData"
    );


    var calledProcessId = "mainPid1::MyCallActivity";
    var calledProcess = mainProcess.calledProcesses[calledProcessId];
    test.ok(calledProcess !== undefined && calledProcess !== null, "testCreatePersistentHierarchicalProcess: calledProcess exists");

    var history = calledProcess.getHistory();
    test.deepEqual(history.historyEntries,
        [
            {
                "name": "MyStart"
            },
            {
                "name": "MyTask"
            }
        ],
        "testCreatePersistentHierarchicalProcess: afterLoading: history"
    );

    var calledProcessState = calledProcess.getState();
    test.deepEqual(calledProcessState.tokens,
        [
            {
                "position": "MyTask",
                "owningProcessId": "mainPid1::MyCallActivity"
            }
        ],
        "testCreatePersistentHierarchicalProcess: afterLoading: called process state"
    );
}


