/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var fileUtils = require('../../../lib/utils/file.js');
var bpmnProcesses = require('../../../lib/process.js');

var Persistency = require('../../../lib/persistency/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNCallActivity = require("../../../lib/parsing/callActivity.js").BPMNCallActivity;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

require("../../../lib/history.js").setDummyTimestampFunction();

var bpmnCalledProcessFileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
var persistencyUri = './test/resources/persistency/testHierarchicalProcess';
var persistency = new Persistency({uri: persistencyUri});

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
        }
    };

    fileUtils.cleanDirectorySync(persistencyUri);

    handler.doneSavingHandler = function(error, savedData) {

        test.ok(error === null, "testCreatePersistentHierarchicalProcess: no error saving.");

        var state = this.getState();
        if (state.tokens[0]) {
            var currentActivity = state.tokens[0].position;

            if (currentActivity === "MyCallActivity") {
                var currentSubActivity = state.tokens[0].substate.tokens[0].position;
                if (currentSubActivity === "MyTask") {
                    // doneSavingHandler is called at least twice: after saving in MyTask and at the very end of the process
                    compareStateSavedAtMyTask(mainProcess, savedData, test);

                    // triggering the next test
                    mainProcess.loadPersistedData();
                }
            }
        } else {
            compareStateSavedAtEndOfMainProcess(mainProcess, savedData, test);
        }
     };

    handler.doneLoadingHandler = function(error, loadedData) {
        test.ok(error === undefined || error === null, "testCreatePersistentHierarchicalProcess: no error loading.");

        compareLoadedStateAtMyTask(mainProcess, loadedData, test);

        var calledProcessId = "mainPid1::MyCallActivity";
        var calledProcess = mainProcess.calledProcesses[calledProcessId];
        calledProcess.taskDone("MyTask");
    };

    mainProcess = bpmnProcesses.createBPMNProcess4Testing("mainPid1", processDefinition, handler, persistency);
    mainProcess.triggerEvent("MyStart");
};

function testProcessRemovalFromCache(mainProcess, done, test) {
    var mainProcessFromCacheBEFOREDoneHandler = bpmnProcesses.getById(mainProcess.processId);
    test.ok(mainProcessFromCacheBEFOREDoneHandler !== undefined, "testCreatePersistentHierarchicalProcess: before handler done() call: is process in cache.");

    done();

    var mainProcessFromCacheAFTERDoneHandler = bpmnProcesses.getById(mainProcess.processId);
    test.ok(mainProcessFromCacheAFTERDoneHandler === undefined, "testCreatePersistentHierarchicalProcess: after handler done() call: is process in cache.");
}

function compareHistoryEntryAtEndOfProcess(mainProcess, test) {
    var history = mainProcess.getHistory();
    test.deepEqual(history.historyEntries,
        [
            {
                "name": "MyStart",
                "type": "startEvent",
                "begin": "_dummy_ts_",
                "end": "_dummy_ts_"
            },
            {
                "name": "MyCallActivity",
                "type": "callActivity",
                "begin": "_dummy_ts_",
                "end": "_dummy_ts_",
                "subhistory": {
                    "historyEntries": [
                        {
                            "name": "MyStart",
                            "type": "startEvent",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "MyTask",
                            "type": "task",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "MyEnd",
                            "type": "endEvent",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        }
                    ],
                    "createdAt": "_dummy_ts_",
                    "finishedAt": "_dummy_ts_"
                }
            },
            {
                "name": "MyEnd",
                "type": "endEvent",
                "begin": "_dummy_ts_",
                "end": null
            }
        ],
        "testSimpleBPMNProcess: history at MyEnd of main process"
    );
}

function compareStateSavedAtMyTask(mainProcess, savedData, test) {
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
    savedData._saved = "_dummy_ts_";

    test.ok(savedData._updated !== undefined, "testCreatePersistentHierarchicalProcess: saving: _updated exists");
    savedData._updated = "_dummy_ts_";

    test.deepEqual(savedData,
        {
            "processName": "MyProcess",
            "processId": "mainPid1",
            "parentToken": null,
            "properties": {},
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
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyCallActivity",
                        "type": "callActivity",
                        "begin": "_dummy_ts_",
                        "end": null,
                        "subhistory": {
                            "historyEntries": [
                                {
                                    "name": "MyStart",
                                    "type": "startEvent",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyTask",
                                    "type": "task",
                                    "begin": "_dummy_ts_",
                                    "end": null
                                }
                            ],
                            "createdAt": "_dummy_ts_",
                            "finishedAt": null
                        }
                    }
                ],
                "createdAt": "_dummy_ts_",
                "finishedAt": null
            },
            "pendingTimeouts": {},
            "_id": 1,
            "_saved": "_dummy_ts_",
            "_updated": "_dummy_ts_"
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
    loadedData._saved = "_dummy_ts_";

    test.ok(loadedData._updated !== undefined, "testCreatePersistentHierarchicalProcess: loading: _updated exists");
    loadedData._updated = "_dummy_ts_";

    test.deepEqual(loadedData,
        {
            "processName": "MyProcess",
            "processId": "mainPid1",
            "parentToken": null,
            "properties": {},
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
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyCallActivity",
                        "type": "callActivity",
                        "begin": "_dummy_ts_",
                        "end": null,
                        "subhistory": {
                            "historyEntries": [
                                {
                                    "name": "MyStart",
                                    "type": "startEvent",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyTask",
                                    "type": "task",
                                    "begin": "_dummy_ts_",
                                    "end": null
                                }
                            ],
                            "createdAt": "_dummy_ts_",
                            "finishedAt": null
                        }
                    }
                ],
                "createdAt": "_dummy_ts_",
                "finishedAt": null
            },
            "pendingTimeouts": {},
            "_id": 1,
            "_saved": "_dummy_ts_",
            "_updated": "_dummy_ts_"
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
                "name": "MyStart",
                "type": "startEvent",
                "begin": "_dummy_ts_",
                "end": "_dummy_ts_"
            },
            {
                "name": "MyTask",
                "type": "task",
                "begin": "_dummy_ts_",
                "end": null
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

function compareStateSavedAtEndOfMainProcess(mainProcess, savedData, test) {
    var state = mainProcess.getState();
    test.deepEqual(state.tokens,
        [],
        "compareStateSavedAtEndOfMainProcess: state at end of main process."
    );

    test.ok(savedData._saved !== undefined, "testCreatePersistentHierarchicalProcess: saving: _saved exists");
    savedData._saved = "_dummy_ts_";

    test.ok(savedData._updated !== undefined, "testCreatePersistentHierarchicalProcess: saving: _updated exists");
    savedData._updated = "_dummy_ts_";

    test.deepEqual(savedData,
        {
            "processName": "MyProcess",
            "processId": "mainPid1",
            "parentToken": null,
            "properties": {},
            "state": {
                "tokens": []
            },
            "history": {
                "historyEntries": [
                    {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyCallActivity",
                        "type": "callActivity",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_",
                        "subhistory": {
                            "historyEntries": [
                                {
                                    "name": "MyStart",
                                    "type": "startEvent",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyTask",
                                    "type": "task",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyEnd",
                                    "type": "endEvent",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                }
                            ],
                            "createdAt": "_dummy_ts_",
                            "finishedAt": "_dummy_ts_"
                        }
                    },
                    {
                        "name": "MyEnd",
                        "type": "endEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    }
                ],
                "createdAt": "_dummy_ts_",
                "finishedAt": "_dummy_ts_"
            },
            "pendingTimeouts": {},
            "_id": 1,
            "_saved": "_dummy_ts_",
            "_updated": "_dummy_ts_"
        },
        "compareStateSavedAtEndOfMainProcess: savedData."
    );

    test.done();
}

