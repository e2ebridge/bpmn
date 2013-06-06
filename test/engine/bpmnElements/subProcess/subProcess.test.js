/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../../lib/process.js');
var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNSubProcess = require("../../../../lib/parsing/subProcess.js").BPMNSubProcess;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

var pathModule = require('path');

exports.testBPMNSubProcess = function(test) {
    var mainProcess;

    /** @type {BPMNProcessDefinition} */
    var subprocessDefinition = new BPMNProcessDefinition("SUB_PROCESS_1", "MySubProcess");
    subprocessDefinition.addFlowObject(new BPMNStartEvent("_sub2", "MySubStart", "startEvent"));
    subprocessDefinition.addFlowObject(new BPMNTask("_sub3", "MySubTask", "task"));
    subprocessDefinition.addFlowObject(new BPMNEndEvent("_sub5", "MySubEnd", "endEvent"));
    subprocessDefinition.addSequenceFlow(new BPMNSequenceFlow("_sub4", "", "sequenceFlow", "_sub2", "_sub3"));
    subprocessDefinition.addSequenceFlow(new BPMNSequenceFlow("_sub6", "", "sequenceFlow", "_sub3", "_sub5"));

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("MAIN_PROCESS_1", "MyProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_main2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNSubProcess("_main3", "MySubProcess", "subProcess", subprocessDefinition));
    processDefinition.addFlowObject(new BPMNEndEvent("_main5", "MyEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_main4", "", "sequenceFlow", "_main2", "_main3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_main6", "", "sequenceFlow", "_main3", "_main5"));

    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MySubProcess": { // subProcess handler start here
            "MySubStart": function(data, done) {
                var localState = this.getState();
                test.deepEqual(localState.tokens,
                    [
                        {
                            "position": "MySubStart",
                            "owningProcessId": "mainPid1::MySubProcess"
                        }
                    ],
                    "testBPMNSubProcess: local state at MySubStart"
                );
                done(data);
            },
            "MySubTask": function(data, done) {
                var localState = this.getState();
                test.deepEqual(localState.tokens,
                    [
                        {
                            "position": "MySubTask",
                            "owningProcessId": "mainPid1::MySubProcess"
                        }
                    ],
                    "testBPMNSubProcess: local state at MySubTask"
                );
                done(data);

                var mainState = mainProcess.getState();
                test.deepEqual(mainState.tokens,
                    [
                        {
                            "position": "MySubProcess",
                            "substate": {
                                "tokens": [
                                    {
                                        "position": "MySubTask",
                                        "owningProcessId": "mainPid1::MySubProcess"
                                    }
                                ]
                            },
                            "owningProcessId": "mainPid1",
                            "calledProcessId": "mainPid1::MySubProcess"
                        }
                    ],
                    "testBPMNSubProcess: main state at MySubTask"
                );

                // we call taskDone for an activity of the sub-process in the main process
                mainProcess.taskDone("MySubTask");
            },
            "MySubTaskDone": function(data, done) {
                var localState = this.getState();
                test.deepEqual(localState.tokens,
                    [
                        {
                            "position": "MySubTask",
                            "owningProcessId": "mainPid1::MySubProcess"
                        }
                    ],
                    "testBPMNSubProcess: local state at MySubTaskDone"
                );
                done(data);
            },
            "MySubEnd": function(data, done) {
                var state = this.getState();
                test.deepEqual(state.tokens,
                    [
                        {
                            "position": "MySubEnd",
                            "owningProcessId": "mainPid1::MySubProcess"
                        }
                    ],
                    "testBPMNSubProcess: state at MySubEnd"
                );
                done(data);
            }
        },
        "MySubProcessDone": function(data, done) {
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
                            "name": "MySubProcess",
                            "subhistory": {
                                "historyEntries": [
                                    {
                                        "name": "MySubStart"
                                    },
                                    {
                                        "name": "MySubTask"
                                    },
                                    {
                                        "name": "MySubEnd"
                                    }
                                ]
                            }
                        },
                        {
                            "name": "MyEnd"
                        }
                    ]
                },
                "testBPMNSubProcess: history at MyEnd of main process"
            );
            done(data);
            test.done();
        }
    };

    mainProcess = bpmnProcessModule.createBPMNProcess4Testing("mainPid1", processDefinition, handler);

    mainProcess.triggerEvent("MyStart");

};