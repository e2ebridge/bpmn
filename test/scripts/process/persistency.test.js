/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNProcessEngine = require('../../../lib/process.js').BPMNProcess;
var Persistency = require('../../../lib/persistency.js').Persistency;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;

var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
processDefinition.addStartEvent(new BPMNStartEvent("_2", "MyStart", "startEvent", [], ["_4"]));
processDefinition.addTask(new BPMNTask("_3", "MyTask", "task", ["_4"], ["_6"]));
processDefinition.addEndEvent(new BPMNEndEvent("_5", "MyEnd", "endEvent", ["_6"], []));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));
var persistencyPath = './test/resources/persistency/testProcessEngine';
var persistency = new Persistency({path: persistencyPath});
var processId = "myPersistentProcess_1";
var testPropertyName = "myprop";

exports.testPersistSimpleBPMNProcess = function(test) {

    persistency.cleanAllSync();

    var handler = {
        "MyStart": function(data, done) {
            test.deepEqual(this.getState().tokens,
                [
                    {
                        "position": "MyStart"
                    }
                ],
                "testPersistSimpleBPMNProcess: state at MyTask BEFORE SAVING"
            );done(data);
        },
        "MyTask": function(data, done) {
            test.deepEqual(this.getState().tokens,
                [
                    {
                        "position": "MyTask"
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
                    "processInstanceId": "myProcess::myPersistentProcess_1",
                    "data": {
                        "myprop": {
                            "an": "object"
                        },
                        "anAdditionalProperty": "Value of an additional property"
                    },
                    "state": {
                        "tokens": [
                            {
                                "position": "MyTask"
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

    var bpmnProcess = new BPMNProcessEngine(processId, processDefinition, handler, persistency);
    bpmnProcess.setProperty(testPropertyName, {an: "object"});
    bpmnProcess.sendStartEvent("MyStart");
  };

exports.testLoadSimpleBPMNProcess = function(test) {

    var handler = {
        "MyTaskDone": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask"
                    }
                ],
                "testPersistSimpleBPMNProcess: state at MyTask AFTER LOADING"
            );
            test.deepEqual(this.data,
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
                        "position": "MyEnd"
                    }
                ],
                "testLoadSimpleBPMNProcess: end event"
            );
            done(data);
            test.done();
        }
    };

    var doneLoading = function(error, loadedData) {
        if (!error && !loadedData) {
            test.ok(false, "testLoadSimpleBPMNProcess: there was nothing to load. Did saving data in the previous testcase work?");
            test.done();
        }

        if (error) {
            test.ok(false, "testLoadSimpleBPMNProcess: failed loading. Error: " + error);
            test.done();
        }

        test.equal(loadedData._id, 1, "testLoadSimpleBPMNProcess: _id");
        test.equal(loadedData.processInstanceId, "myProcess::myPersistentProcess_1", "testLoadSimpleBPMNProcess: processInstanceId");
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
                    "position": "MyTask"
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

        test.ok(this.deferEvents, "testLoadSimpleBPMNProcess: deferEvents");

        var deferredEvents = this.deferredEvents;
        test.deepEqual(deferredEvents,
            [
                {
                    "type": "taskDoneEvent",
                    "name": "MyTask",
                    "data": {}
                }
            ],
            "testLoadSimpleBPMNProcess: deferred after loading");
    };

    var newBpmnProcess = new BPMNProcessEngine(processId, processDefinition, handler, persistency);
    newBpmnProcess.loadState(doneLoading);

    newBpmnProcess.taskDone("MyTask");

};