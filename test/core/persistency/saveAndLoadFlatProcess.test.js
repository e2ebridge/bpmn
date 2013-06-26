/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fileUtils = require('../../../lib/utils/file.js');
var pathModule = require('path');
var bpmnProcessModule = require('../../../lib/process.js');
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

var persistencyPath = pathModule.join(__dirname, '../../resources/persistency/testProcessEngine');
var persistency = new Persistency({path: persistencyPath});
var processId = "myPersistentProcess_1";
var testPropertyName = "myprop";

exports.testPersistSimpleProcess = function(test) {

    fileUtils.cleanDirectorySync(persistencyPath);

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
            );done(data);
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
            savedData._saved = "FIXEDTIMESTAMP4TESTING";

            test.ok(savedData._updated !== undefined, "testPersistSimpleProcess: _updated exists");
            savedData._updated = "FIXEDTIMESTAMP4TESTING";

            test.deepEqual(savedData,
                {
                    "processName": "MyTestProcessType",
                    "processId": "myPersistentProcess_1",
                    "parentToken": null,
                    "data": {
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
                                "begin": "_dummy_ts_",
                                "end": "_dummy_ts_"
                            },
                            {
                                "name": "MyTask",
                                "begin": "_dummy_ts_",
                                "end": null
                            }
                        ],
                        "createdAt": "_dummy_ts_"
                    },
                    "pendingTimeouts": {},
                    "_saved": "FIXEDTIMESTAMP4TESTING",
                    "_updated": "FIXEDTIMESTAMP4TESTING",
                    "_id": 1
                },
                "testPersistSimpleProcess: saved data"
            );

            test.done();
        }
    };

    var bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing(processId, processDefinition, handler, persistency);
    bpmnProcess.setProperty(testPropertyName, {an: "object"});
    bpmnProcess.triggerEvent("MyStart");
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
            // data is not in the process client interface. Thus, we have to use the process instance to get it
            test.deepEqual(newBpmnProcess.data,
                {
                    "myprop": {
                        "an": "object"
                    },
                    "anAdditionalProperty": "Value of an additional property"
                },
                "testPersistSimpleProcess: data at MyTask AFTER LOADING"
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
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "MyTask",
                    "begin": "_dummy_ts_",
                    "end": null
                }
            ],
            "testLoadSimpleBPMNProcess: history"
        );
        test.deepEqual(loadedData.data,
            {
                "myprop": {
                    "an": "object"
                },
                "anAdditionalProperty": "Value of an additional property"
            },
            "testLoadSimpleBPMNProcess: data"
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

        // deferEvents flag is not in the process client interface. Thus, we have to use the process instance to get it
        test.ok(newBpmnProcess.deferEvents, "testLoadSimpleBPMNProcess: deferEvents");

        // deferredEvents is not in the process client interface. Thus, we have to use the process instance to get it
        var deferredEvents = newBpmnProcess.deferredEvents;
        test.deepEqual(deferredEvents,
            [
                {
                    "type": "ACTIVITY_END_EVENT",
                    "name": "MyTask",
                    "data": {}
                }
            ],
            "testLoadSimpleBPMNProcess: deferred after loading");
    };

    newBpmnProcess = bpmnProcessModule.createBPMNProcess4Testing(processId, processDefinition, handler, persistency);

    newBpmnProcess.taskDone("MyTask");

};