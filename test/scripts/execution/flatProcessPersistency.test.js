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
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;

var processDefinition = new BPMNProcessDefinition("PROCESS_1", "MyTestProcessType");
processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
processDefinition.addFlowObject(new BPMNTask("_3", "MyTask", "task"));
processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

var persistencyPath = './test/resources/persistency/testProcessEngine';
var persistency = new Persistency({path: persistencyPath});
var processId = "myPersistentProcess_1";
var testPropertyName = "myprop";

exports.testCreatePersistentBPMNProcess = function(test) {
    var bpmnProcess;

    var persistencyPath = './test/resources/persistency/testPersistentProcess';
    fileUtilsModule.cleanDirectorySync(persistencyPath);

    var savedState = function(error, savedData) {
        test.ok(error === null, "testCreatePersistentBPMNProcess: no error saving.");

        var state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask",
                    "substate": null,
                    "owningProcessId": "myid"
                }
            ],
            "testCreatePersistentBPMNProcess: reached first wait state."
        );

        test.deepEqual(savedData,
            {
                "processId": "myid",
                "data": {},
                "state": {
                    "tokens": [
                        {
                            "position": "MyTask",
                            "substate": null,
                            "owningProcessId": "myid"
                        }
                    ]
                },
                "history": [
                    "MyStart",
                    "MyTask"
                ],
                "_id": 1
            },
            "testCreatePersistentBPMNProcess: saved data."
        );

        // this points to the process client interface and not to the process directly
        this._bpmnProcess.loadState();
    };

    var loadedState = function(error, loadedData) {
        test.ok(error === undefined || error === null, "testCreatePersistentBPMNProcess: no error loading.");

        var state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask",
                    "substate": null,
                    "owningProcessId": "myid"
                }
            ],
            "testCreatePersistentBPMNProcess: reached save state."
        );

        test.deepEqual(loadedData,
            {
                "processId": "myid",
                "data": {},
                "state": {
                    "tokens": [
                        {
                            "position": "MyTask",
                            "substate": null,
                            "owningProcessId": "myid"
                        }
                    ]
                },
                "history": [
                    "MyStart",
                    "MyTask"
                ],
                "_id": 1
            },
            "testCreatePersistentBPMNProcess: loaded data."
        );

        test.done();
    };

    var fileName = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    bpmnProcess = bpmnProcessModule.getBPMNProcess("myid", fileName, persistencyPath, loadedState, savedState);

    // we let the process run to the first save state
    bpmnProcess.sendStartEvent("MyStart");
};


exports.testLoadHandler = function(test) {
    var handlerFilePath = bpmnProcessModule.getHandlerFileName("a/b/c.bpmn");
    test.equal(handlerFilePath, "a/b/c.js","testLoadHandler: handlerFilePath");

    var bpmnFilePath = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var handler = bpmnProcessModule.getHandler(bpmnFilePath);
    var myTaskHandler = handler["MyTask"];
    var foundMyTask = myTaskHandler && typeof myTaskHandler === 'function';
    test.equal(foundMyTask, true,"testLoadHandler");

    test.done();
};

exports.testPersistSimpleBPMNProcess = function(test) {

    persistency.cleanAllSync();

    var handler = {
        "MyStart": function(data, done) {
            test.deepEqual(this.getState().tokens,
                [
                    {
                        "position": "MyStart",
                        "substate": null,
                        "owningProcessId": "myPersistentProcess_1"
                    }
                ],
                "testPersistSimpleBPMNProcess: state at MyTask BEFORE SAVING"
            );done(data);
        },
        "MyTask": function(data, done) {
            test.deepEqual(this.getState().tokens,
                [
                    {
                        "position": "MyTask",
                        "substate": null,
                        "owningProcessId": "myPersistentProcess_1"
                    }
                ],
                "testPersistSimpleBPMNProcess: state at MyTask BEFORE SAVING"
            );
            this.setProperty("anAdditionalProperty", "Value of an additional property");

            done(data);
        },
        "doneSavingHandler": function(error, savedData) {
            if (error) {
                test.ok(false, "testPersistSimpleBPMNProcess: error at saving SAVING");
                test.done();
            }

            test.deepEqual(savedData,
                {
                    "processId": "myPersistentProcess_1",
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
                                "substate": null,
                                "owningProcessId": "myPersistentProcess_1"
                            }
                        ]
                    },
                    "history": [
                        "MyStart",
                        "MyTask"
                    ],
                    "_id": 1
                },
                "testPersistSimpleBPMNProcess: saved data"
            );

            test.done();
        }
    };

    var bpmnProcess = bpmnProcessModule.createBPMNProcess(processId, processDefinition, handler, persistency);
    bpmnProcess.setProperty(testPropertyName, {an: "object"});
    bpmnProcess.sendStartEvent("MyStart");
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
                        "substate": null,
                        "owningProcessId": "myPersistentProcess_1"
                    }
                ],
                "testPersistSimpleBPMNProcess: state at MyTask AFTER LOADING"
            );
            // data is not in the process client interface. Thus, we have to use the process instance to get it
            test.deepEqual(newBpmnProcess.data,
                {
                    "myprop": {
                        "an": "object"
                    },
                    "anAdditionalProperty": "Value of an additional property"
                },
                "testPersistSimpleBPMNProcess: data at MyTask AFTER LOADING"
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

        test.equal(loadedData._id, 1, "testLoadSimpleBPMNProcess: _id");
        test.equal(loadedData.processId, "myPersistentProcess_1", "testLoadSimpleBPMNProcess:processIdd");
        test.deepEqual(loadedData.history,
            [
                "MyStart",
                "MyTask"
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
                    "substate": null,
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
                    "type": "activityFinishedEvent",
                    "name": "MyTask",
                    "data": {}
                }
            ],
            "testLoadSimpleBPMNProcess: deferred after loading");
    };

    // Todo this test properly we have to delete the cache otherwise we might take an old version of this process
    bpmnProcessModule.clearActiveProcessesCache();
    newBpmnProcess = bpmnProcessModule.createBPMNProcess(processId, processDefinition, handler, persistency);
    newBpmnProcess.loadState();

    newBpmnProcess.taskDone("MyTask");

};