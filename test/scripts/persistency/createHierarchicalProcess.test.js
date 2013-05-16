/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var fileUtilsModule = require('../../../lib/utils/file.js');
var bpmnProcessModule = require('../../../lib/process.js');
var Persistency = require('../../../lib/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNCallActivity = require("../../../lib/bpmn/callActivity.js").BPMNCallActivity;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;

var bpmnCalledProcessFileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
var persistencyPath = './test/resources/persistency/testHierarchicalProcess';
var persistency = new Persistency({path: persistencyPath});

var processDefinition = new BPMNProcessDefinition("PROCESS_1", "MyProcess");
processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
processDefinition.addFlowObject(new BPMNCallActivity("_3", "MyCallActivity", "callActivity",
    "MyTaskExampleProcess", "http://sourceforge.net/bpmn/definitions/_1363693864276", bpmnCalledProcessFileName));
processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

exports.testCreatePersistentBPMNProcess = function(test) {
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
        test.ok(error === null, "testCreatePersistentBPMNProcess: no error saving.");

        compareSavedStateAtMyTask(mainProcess, savedData, test);

        mainProcess.loadPersistedData();
    };

    handler.doneLoadingHandler = function(error, loadedData) {
        test.ok(error === undefined || error === null, "testCreatePersistentBPMNProcess: no error loading.");

        compareLoadedStateAtMyTask(mainProcess, loadedData, test);

        var calledProcessId = "mainPid1::MyCallActivity";
        var calledProcess = mainProcess.calledProcesses[calledProcessId];
        calledProcess.taskDone("MyTask");
    };

    mainProcess = bpmnProcessModule.createBPMNProcess4Testing("mainPid1", processDefinition, handler, persistency);
    mainProcess.sendEvent("MyStart");
};

function testProcessRemovalFromCache(mainProcess, done, test) {
    var mainProcessFromCacheBEFOREDoneHandler = bpmnProcessModule.getFromActiveProcessesCache(mainProcess.processId);
    test.ok(mainProcessFromCacheBEFOREDoneHandler !== undefined, "testCreatePersistentBPMNProcess: before handler done() call: is process in cache.");

    done();

    var mainProcessFromCacheAFTERDoneHandler = bpmnProcessModule.getFromActiveProcessesCache(mainProcess.processId);
    test.ok(mainProcessFromCacheAFTERDoneHandler === undefined, "testCreatePersistentBPMNProcess: after handler done() call: is process in cache.");
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
        "testCreatePersistentBPMNProcess: state at MyTask."
    );

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
            "_id": 1
        },
        "testCreatePersistentBPMNProcess: savedData."
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
        "testCreatePersistentBPMNProcess: afterLoading: process tokens"
    );

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
            "_id": 1
        },
        "testCreatePersistentBPMNProcess: loadedData"
    );


    var calledProcessId = "mainPid1::MyCallActivity";
    var calledProcess = mainProcess.calledProcesses[calledProcessId];
    test.ok(calledProcess !== undefined && calledProcess !== null, "testCreatePersistentBPMNProcess: calledProcess exists");

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
        "testCreatePersistentBPMNProcess: afterLoading: history"
    );

    var calledProcessState = calledProcess.getState();
    test.deepEqual(calledProcessState.tokens,
        [
            {
                "position": "MyTask",
                "owningProcessId": "mainPid1::MyCallActivity"
            }
        ],
        "testCreatePersistentBPMNProcess: afterLoading: called process state"
    );
}


