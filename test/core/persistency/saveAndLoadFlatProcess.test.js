/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var fileUtils = require('../../../lib/utils/file.js');
var path = require('path');
var bpmnProcesses = require('../../../lib/process.js');

var Persistency = require('../../../lib/persistency/persistency.js').Persistency;
var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

require("../../../lib/history.js").setDummyTimestampFunction();

var processDefinition = new BPMNProcessDefinition("PROCESS_1", "MyTestProcessType");
processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

var persistencyUri = path.join(__dirname, '../../resources/persistency/testProcessEngine');
var persistency = new Persistency({uri: persistencyUri});
var processId = "myPersistentProcess_1";
var testPropertyName = "myprop";

exports.testPersistSimpleProcess = function(test) {

    fileUtils.cleanDirectorySync(persistencyUri);

    var handler = {
        "MyStart": function(data, done) {
            test.deepEqual(this.getState().tokens,
                [
                    {
                        "position": "MyStart",
                        "owningProcessId": "myPersistentProcess_1"
                    }
                ],
                "testPersistSimpleProcess: state at MyTask BEFORE SAVING"
            );
            done(data);
        },
        "MyTask": function(data, done) {
            test.deepEqual(this.getState().tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myPersistentProcess_1"
                    }
                ],
                "testPersistSimpleProcess: state at MyTask BEFORE SAVING"
            );
            this.setProperty("anAdditionalProperty", "Value of an additional property");

            done(data);
        },
        "doneSavingHandler": function(error, savedData) {
            if (error) {
                test.ok(false, "testPersistSimpleProcess: error at saving SAVING");
                test.done();
            }

            test.ok(savedData._saved !== undefined, "testPersistSimpleProcess: _saved exists");
            savedData._saved = "_dummy_ts_";

            test.ok(savedData._updated !== undefined, "testPersistSimpleProcess: _updated exists");
            savedData._updated = "_dummy_ts_";

            test.deepEqual(savedData,
                {
                    "processName": "MyTestProcessType",
                    "processId": "myPersistentProcess_1",
                    "parentToken": null,
                    "properties": {
                        "myprop": {
                            "an": "object"
                        },
                        "anAdditionalProperty": "Value of an additional property"
                    },
                    "state": {
                        "tokens": [
                            {
                                "position": "MyTask",
                                "owningProcessId": "myPersistentProcess_1"
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
                                "name": "MyTask",
                                "type": "task",
                                "begin": "_dummy_ts_",
                                "end": null
                            }
                        ],
                        "createdAt": "_dummy_ts_",
                        "finishedAt": null
                    },
                    "pendingTimeouts": {},
                    "views": {
                        "startEvent": {
                            "name": "MyStart",
                            "type": "startEvent",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        "endEvent": null,
                        "duration": null
                    },
                    "_saved": "_dummy_ts_",
                    "_updated": "_dummy_ts_",
                    "_id": 1
                },
                "testPersistSimpleProcess: saved data"
            );

            test.done();
        }
    };

    bpmnProcesses.createBPMNProcess(processId, processDefinition, handler, persistency, function(err, bpmnProcess){
        bpmnProcess.setProperty(testPropertyName, {an: "object"});
        bpmnProcess.triggerEvent("MyStart");
    });
  };

exports.testLoadSimpleBPMNProcess = function(test) {
    var newBpmnProcess;

    var handler = {
        "MyTaskDone": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myPersistentProcess_1"
                    }
                ],
                "testPersistSimpleProcess: state at MyTask AFTER LOADING"
            );
            test.deepEqual(newBpmnProcess.properties,
                {
                    "myprop": {
                        "an": "object"
                    },
                    "anAdditionalProperty": "Value of an additional property"
                },
                "testPersistSimpleProcess: properties at MyTask AFTER LOADING"
            );
            done(data);
        },
        "MyEnd": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyEnd",
                        "owningProcessId": "myPersistentProcess_1"
                    }
                ],
                "testLoadSimpleBPMNProcess: end event"
            );
            done(data);
            test.done();
        }
    };

    handler.doneLoadingHandler = function(error, loadedData) {
        if (!error && !loadedData) {
            test.ok(false, "testLoadSimpleBPMNProcess: there was nothing to load. Did saving data in the previous testcase work?");
            test.done();
        }

        if (error) {
            test.ok(false, "testLoadSimpleBPMNProcess: failed loading. Error: " + error);
            test.done();
        }

        test.equal(loadedData._id, 1, "testLoadSimpleBPMNProcess: _id ok");
        test.ok(loadedData._saved !== undefined, "testLoadSimpleBPMNProcess: _saved exists");
        test.ok(loadedData._updated !== undefined, "testLoadSimpleBPMNProcess: _updated exists");
        test.equal(loadedData.processId, "myPersistentProcess_1", "testLoadSimpleBPMNProcess:processIdd");
        test.deepEqual(loadedData.history.historyEntries,
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
            "testLoadSimpleBPMNProcess: history"
        );
        test.deepEqual(loadedData.properties,
            {
                "myprop": {
                    "an": "object"
                },
                "anAdditionalProperty": "Value of an additional property"
            },
            "testLoadSimpleBPMNProcess: properties"
        );
        test.deepEqual(loadedData.state.tokens,
            [
                {
                    "position": "MyTask",
                    "owningProcessId": "myPersistentProcess_1"
                }
            ],
            "testLoadSimpleBPMNProcess: tokens"
        );

        var myProperty = this.getProperty(testPropertyName);
        test.deepEqual(
            myProperty,
            {
                "an": "object"
            },
            "testLoadSimpleBPMNProcess: get loaded property"
        );


    };

    newBpmnProcess = bpmnProcesses.createBPMNProcess(processId, processDefinition, handler, persistency, function(err, process){
        newBpmnProcess = process;

        newBpmnProcess.taskDone("MyTask");
    });

};

exports.testLoadSimpleBPMNProcessCallback = function(test) {
    var newBpmnProcess;

    var handler = {
        "MyTaskDone": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myPersistentProcess_1"
                    }
                ],
                "testPersistSimpleProcess: state at MyTask AFTER LOADING"
            );
            test.deepEqual(newBpmnProcess.properties,
                {
                    "myprop": {
                        "an": "object"
                    },
                    "anAdditionalProperty": "Value of an additional property"
                },
                "testPersistSimpleProcess: properties at MyTask AFTER LOADING"
            );
            done(data);
        }
    };

    newBpmnProcess = bpmnProcesses.createBPMNProcess(processId, processDefinition, handler, persistency, function(err, newBpmnProcess){

        test.deepEqual(newBpmnProcess.getHistory().historyEntries,
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
            "testLoadSimpleBPMNProcess: history"
        );
        test.deepEqual(newBpmnProcess.getState().tokens,
            [
                {
                    "position": "MyTask",
                    "owningProcessId": "myPersistentProcess_1"
                }
            ],
            "testLoadSimpleBPMNProcess: tokens"
        );

        var myProperty = newBpmnProcess.getProperty(testPropertyName);
        test.deepEqual(
            myProperty,
            {
                "an": "object"
            },
            "testLoadSimpleBPMNProcess: get loaded property"
        );

        test.done();
    });


};
