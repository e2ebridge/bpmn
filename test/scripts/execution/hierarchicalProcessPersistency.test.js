/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var fileUtilsModule = require('../../../lib/utils/file.js');
var bpmnProcessModule = require('../../../lib/execution/process.js');
var Persistency = require('../../../lib/execution/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNCallActivity = require("../../../lib/bpmn/callActivity.js").BPMNCallActivity;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;

var processDefinition = new BPMNProcessDefinition("PROCESS_1", "MyTestProcessType");
processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

var bpmnSubprocessFileName = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
var persistencyPath = './test/resources/persistency/testHierarchicalProcess';
var persistency = new Persistency({path: persistencyPath});

var processDefinition = new BPMNProcessDefinition("PROCESS_1", "MyProcess");
processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
processDefinition.addFlowObject(new BPMNCallActivity("_3", "MyCallActivity", "callActivity",
    "MyTaskExampleProcess", "http://sourceforge.net/bpmn/definitions/_1363693864276", bpmnSubprocessFileName));
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
                    "substate": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "substate": null,
                                "owningProcessId": "mainPid1::MyCallActivity"
                            }
                        ]
                    },
                    "owningProcessId": "mainPid1"
                }
            ],
            "testCreatePersistentBPMNProcess: reached wait state."
        );

        test.deepEqual(savedData,
            {
                "activeSubprocess": {
                    "processId": "mainPid1::MyCallActivity",
                    "data": {},
                    "state": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "substate": null,
                                "owningProcessId": "mainPid1::MyCallActivity"
                            }
                        ]
                    },
                    "history": [
                        "MyStart",
                        "MyTask"
                    ]
                },
                "activeSubprocessParentToken": {
                    "position": "MyCallActivity",
                    "substate": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "substate": null,
                                "owningProcessId": "mainPid1::MyCallActivity"
                            }
                        ]
                    },
                    "owningProcessId": "mainPid1"
                },
                "processId": "mainPid1",
                "data": {},
                "state": {
                    "tokens": [
                        {
                            "position": "MyCallActivity",
                            "substate": {
                                "tokens": [
                                    {
                                        "position": "MyTask",
                                        "substate": null,
                                        "owningProcessId": "mainPid1::MyCallActivity"
                                    }
                                ]
                            },
                            "owningProcessId": "mainPid1"
                        }
                    ]
                },
                "history": [
                    "MyStart",
                    "MyCallActivity",
                    {
                        "MyCallActivity": [
                            "MyStart",
                            "MyTask"
                        ]
                    }
                ],
                "_id": 1
            },
            "testCreatePersistentBPMNProcess: saved data."
        );

        var subprocessId = "mainPid1::MyCallActivity";
        var activeProcesses = bpmnProcessModule.getActiveProcessesCache();
        var subprocess = activeProcesses[subprocessId];
        test.ok(subprocess !== undefined && subprocess !== null, "testCreatePersistentBPMNProcess: subprocess exists");

        // we delete the subprocess now, to see whether it will be regenerated when loading the process
        delete activeProcesses[subprocessId];
        test.ok(activeProcesses[subprocessId] === undefined, "testCreatePersistentBPMNProcess: subprocess has been deleted");

        mainProcess.loadState();
    };

    var loadedState = function(error, loadedData) {
        test.ok(error === undefined || error === null, "testCreatePersistentBPMNProcess: no error loading.");

        var state = mainProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyCallActivity",
                    "substate": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "substate": null,
                                "owningProcessId": "mainPid1::MyCallActivity"
                            }
                        ]
                    },
                    "owningProcessId": "mainPid1"
                }
            ],
            "testCreatePersistentBPMNProcess: reached save state."
        );

        test.deepEqual(loadedData,
            {
                "activeSubprocess": {
                    "processId": "mainPid1::MyCallActivity",
                    "data": {},
                    "state": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "substate": null,
                                "owningProcessId": "mainPid1::MyCallActivity"
                            }
                        ]
                    },
                    "history": [
                        "MyStart",
                        "MyTask"
                    ]
                },
                "activeSubprocessParentToken": {
                    "position": "MyCallActivity",
                    "substate": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "substate": null,
                                "owningProcessId": "mainPid1::MyCallActivity"
                            }
                        ]
                    },
                    "owningProcessId": "mainPid1"
                },
                "processId": "mainPid1",
                "data": {},
                "state": {
                    "tokens": [
                        {
                            "position": "MyCallActivity",
                            "substate": {
                                "tokens": [
                                    {
                                        "position": "MyTask",
                                        "substate": null,
                                        "owningProcessId": "mainPid1::MyCallActivity"
                                    }
                                ]
                            },
                            "owningProcessId": "mainPid1"
                        }
                    ]
                },
                "history": [
                    "MyStart",
                    "MyCallActivity",
                    {
                        "MyCallActivity": [
                            "MyStart",
                            "MyTask"
                        ]
                    }
                ],
                "_id": 1
            },
            "testCreatePersistentBPMNProcess: loaded data."
        );

        var subprocessId = "mainPid1::MyCallActivity";
        var activeProcesses = bpmnProcessModule.getActiveProcessesCache();
        var subprocess = activeProcesses[subprocessId];
        test.ok(subprocess !== undefined && subprocess !== null, "testCreatePersistentBPMNProcess: subprocess exists");

        test.done();
    };

    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MyCallActivity": { // subprocess handler start here
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
            test.deepEqual(history,
                [
                    "MyStart",
                    "MyCallActivity",
                    {
                        "MyCallActivity": [
                            "MyStart",
                            "MyTask",
                            "MyEnd"
                        ]
                    },
                    "MyEnd"
                ],
                "testSimpleBPMNProcess: history at MyEnd of main process"
            );
            done(data);
            test.done();
        }
    };

    handler.doneLoadingHandler = loadedState;
    handler.doneSavingHandler = savedState;

    mainProcess = bpmnProcessModule.createBPMNProcess("mainPid1", processDefinition, handler, persistency);

    mainProcess.sendStartEvent("MyStart");
};
