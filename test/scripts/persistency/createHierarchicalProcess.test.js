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

    fileUtilsModule.cleanDirectorySync(persistencyPath);

    var savedState = function(error, savedData) {
        test.ok(error === null, "testCreatePersistentBPMNProcess: no error saving.");

        var state = mainProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyCallActivity",
                    "substate": null,
                    "calledProcessId": "mainPid1::MyCallActivity",
                    "owningProcessId": "mainPid1"
                }
            ],
            "testCreatePersistentBPMNProcess: reached call activity state."
        );

        if (savedData.processId === "mainPid1") {
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
                                "substate": null,
                                "calledProcessId": "mainPid1::MyCallActivity",
                                "owningProcessId": "mainPid1"
                            }
                        ]
                    },
                    "history": {
                        "historyEntries": [
                            {
                                "name": "MyStart"
                            },
                            {
                                "name": "MyCallActivity"
                            }
                        ]
                    },
                    "eventName2TimeoutMap": {},
                    "_id": 1
                },
                "testCreatePersistentBPMNProcess: saved parent process data."
            );
        } else {
            test.deepEqual(savedData,
                {
                    "processName": "TaskExampleProcess",
                    "processId": "mainPid1::MyCallActivity",
                    "parentToken": {
                        "position": "MyCallActivity",
                        "substate": null,
                        "calledProcessId": "mainPid1::MyCallActivity",
                        "owningProcessId": "mainPid1"
                    },
                    "data": {},
                    "state": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "substate": null,
                                "calledProcessId": null,
                                "owningProcessId": "mainPid1::MyCallActivity"
                            }
                        ]
                    },
                    "history": {
                        "historyEntries": [
                            {
                                "name": "MyStart"
                            },
                            {
                                "name": "MyTask"
                            }
                        ]
                    },
                    "eventName2TimeoutMap": {},
                    "_id": 2
                },
                "testCreatePersistentBPMNProcess: saved called process data."
            );

            var calledProcessId = "mainPid1::MyCallActivity";
            var calledProcess = mainProcess.calledProcesses[calledProcessId];
            test.ok(calledProcess !== undefined && calledProcess !== null, "testCreatePersistentBPMNProcess: calledProcess exists");

            mainProcess.loadPersistedData();
        }
    };

    var loadedState = function(error, loadedData) {
        test.ok(error === undefined || error === null, "testCreatePersistentBPMNProcess: no error loading.");

        if (loadedData.processId === "mainPid1") {
            var mainState = mainProcess.getState();
            test.deepEqual(mainState.tokens,
                [
                    {
                        "position": "MyCallActivity",
                        "substate": null,
                        "calledProcessId": "mainPid1::MyCallActivity",
                        "owningProcessId": "mainPid1"
                    }
                ],
                "testCreatePersistentBPMNProcess: reached save state."
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
                                "substate": null,
                                "calledProcessId": "mainPid1::MyCallActivity",
                                "owningProcessId": "mainPid1"
                            }
                        ]
                    },
                    "history": {
                        "historyEntries": [
                            {
                                "name": "MyStart"
                            },
                            {
                                "name": "MyCallActivity"
                            }
                        ]
                    },
                    "eventName2TimeoutMap": {},
                    "_id": 1
                },
                "testCreatePersistentBPMNProcess: loaded data of main process"
            );

        } else {

            test.deepEqual(loadedData,
                {
                    "processName": "TaskExampleProcess",
                    "processId": "mainPid1::MyCallActivity",
                    "parentToken": {
                        "position": "MyCallActivity",
                        "substate": null,
                        "calledProcessId": "mainPid1::MyCallActivity",
                        "owningProcessId": "mainPid1"
                    },
                    "data": {},
                    "state": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "substate": null,
                                "calledProcessId": null,
                                "owningProcessId": "mainPid1::MyCallActivity"
                            }
                        ]
                    },
                    "history": {
                        "historyEntries": [
                            {
                                "name": "MyStart"
                            },
                            {
                                "name": "MyTask"
                            }
                        ]
                    },
                    "eventName2TimeoutMap": {},
                    "_id": 2
                },
                "testCreatePersistentBPMNProcess: loaded data of called process"
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
                "testCreatePersistentBPMNProcess: loaded called process history"
            );

            var calledProcessState = calledProcess.getState();
            test.deepEqual(calledProcessState.tokens,
                [
                    {
                        "position": "MyTask",
                        "substate": null,
                        "calledProcessId": null,
                        "owningProcessId": "mainPid1::MyCallActivity"
                    }
                ],
                "testCreatePersistentBPMNProcess: loaded called process state"
            );

            calledProcess.taskDone("MyTask");
        }

    };

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
            "MyEnd": function(data, done) {
                done(data);
            }
        },
        "MyEnd": function(data, done) {
            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "MyStart"
                    },
                    {
                        "name": "MyCallActivity"
                    },
                    {
                        "name": "MyEnd"
                    }
                ],
                "testSimpleBPMNProcess: history at MyEnd of main process"
            );
            done(data);
            test.done();
        }
    };

    handler.doneLoadingHandler = loadedState;
    handler.doneSavingHandler = savedState;

    mainProcess = bpmnProcessModule.createBPMNProcess4Testing("mainPid1", processDefinition, handler, persistency);

    mainProcess.sendEvent("MyStart");
};
