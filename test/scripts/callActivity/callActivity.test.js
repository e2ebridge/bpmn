/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../lib/process.js');
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNCallActivity = require("../../../lib/bpmn/callActivity.js").BPMNCallActivity;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var pathModule = require('path');

exports.testBPMNCallActivity = function(test) {
    var mainProcess;
    var bpmnSubprocessFileName = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "MyProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNCallActivity("_3", "MyCallActivity", "callActivity",
        "MyTaskExampleProcess", "http://sourceforge.net/bpmn/definitions/_1363693864276", bpmnSubprocessFileName));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MyCallActivity": { // subprocess handler start here
            "MyStart": function(data, done) {
                var localState = this.getState();
                test.deepEqual(localState.tokens,
                    [
                        {
                            "position": "MyStart",
                            "substate": null,
                            "owningProcessId": "mainPid1::MyCallActivity"
                        }
                    ],
                    "testBPMNCallActivity: local state at MyCallActivity"
                );
                done(data);
            },
            "MyTask": function(data, done) {
                var localState = this.getState();
                test.deepEqual(localState.tokens,
                    [
                        {
                            "position": "MyTask",
                            "substate": null,
                            "owningProcessId": "mainPid1::MyCallActivity"
                        }
                    ],
                    "testSimpleBPMNProcess: local state at MyTask"
                );
                done(data);

                var mainState = mainProcess.getState();
                test.deepEqual(mainState.tokens,
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
                    "testSimpleBPMNProcess: main state at MyTask"
                );

                mainProcess.taskDone("MyTask");
            },
            "MyTaskDone": function(data, done) {
                var localState = this.getState();
                test.deepEqual(localState.tokens,
                    [
                        {
                            "position": "MyTask",
                            "substate": null,
                            "owningProcessId": "mainPid1::MyCallActivity"
                        }
                    ],
                    "testSimpleBPMNProcess: local state at MyTaskDone"
                );
                done(data);
            },
            "MyEnd": function(data, done) {
                var state = this.getState();
                test.deepEqual(state.tokens,
                    [
                        {
                            "position": "MyEnd",
                            "substate": null,
                            "owningProcessId": "mainPid1::MyCallActivity"
                        }
                    ],
                    "testSimpleBPMNProcess: state at MyEnd"
                );
                var history = this.getParentProcess().getHistory();
                var callActivityHistory = history.getLastEntry("MyCallActivity");
                test.deepEqual(callActivityHistory,
                    {
                        "name": "MyCallActivity",
                        "subprocessHistory": {
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
                    "testSimpleBPMNProcess: callActivity history"
                );
                done(data);
            }
        },
        "MyCallActivityDone": function(data, done) {
            done(data);
        },
        "MyEnd": function(data, done) {
            var history = this.getHistory();
            test.deepEqual(history,
                {
                    "historyEntries": [
                        {
                            "name": "MyStart"
                        },
                        {
                            "name": "MyCallActivity",
                            "subprocessHistory": {
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
                    ]
                },
                "testSimpleBPMNProcess: history at MyEnd of main process"
            );
            done(data);
            test.done();
        }
    };

    mainProcess = bpmnProcessModule.createBPMNProcess4Testing("mainPid1", processDefinition, handler);

    mainProcess.sendStartEvent("MyStart");

};