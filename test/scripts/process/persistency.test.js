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

var persistencyPath = './test/resources/persistency/testProcessEngine';

function getMockupProcessDefinition() {

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "MyStart", "startEvent", [], ["_4"]));
    processDefinition.addTask(new BPMNTask("_3", "MyTask", "task", ["_4"], ["_6"]));
    processDefinition.addEndEvent(new BPMNEndEvent("_5", "MyEnd", "endEvent", ["_6"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    return processDefinition;
}

exports.testSimpleBPMNProcessPersistency = function(test) {
    var processId = "myPersistentProcess_1";

    var persistency = new Persistency({path: persistencyPath});
    persistency.cleanAllSync();

    var state;
    var processDefinition = getMockupProcessDefinition();

    var handler = {
        "MyStart": function(data, done) {
            //console.log("Calling handler for 'MyStart'");
            done(data);
        },
        "MyTask": function(data, done) {
            //console.log("Calling handler for 'MyTask'");
            done(data);
        },
        "MyTaskDone": function(data, done) {
            //console.log("Calling handler for 'MyTaskDone'");
            done(data);
        },
        "MyEnd": function(data, done) {
            //console.log("Calling handler for 'MyEnd'");
            done(data);
        }
    };

    var bpmnProcess = new BPMNProcessEngine(processId, processDefinition, handler, persistency);
    var testPropertyName = "myprop";
    bpmnProcess.setProperty(testPropertyName, {an: "object"});

    bpmnProcess.emitEvent("MyStart");

    process.nextTick(function() {
        //console.log("Comparing state after start event");
        state = bpmnProcess.getState();
        test.deepEqual(state,
            [
                {
                    "bpmnId": "_3",
                    "name": "MyTask",
                    "type": "task",
                    "outgoingRefs": [
                        "_6"
                    ],
                    "incomingRefs": [
                        "_4"
                    ],
                    "waitForTaskDoneEvent": true
                }
            ],
            "testSimpleBPMNProcessPersistency: initial task"
        );
    });

    var newProcessEngine;
    var doneSaving = function(error, savedData) {
        test.deepEqual(
            savedData,
            {
                "processInstanceId": "myProcess::myPersistentProcess_1",
                "data": {
                    "myprop": {
                        "an": "object"
                    }
                },
                "state": [
                    {
                        "bpmnId": "_3",
                        "name": "MyTask",
                        "type": "task",
                        "outgoingRefs": [
                            "_6"
                        ],
                        "incomingRefs": [
                            "_4"
                        ],
                        "waitForTaskDoneEvent": true
                    }
                ],
                "_id": 1
            },
            "testSimpleBPMNProcessPersistency: saved data"
        );
        //console.log("Saved process");

        bpmnProcess = null;
        //console.log("Destroyed the process engine!");

        newProcessEngine = new BPMNProcessEngine(processId, processDefinition, handler, persistency);
        //console.log("Created new process engine");

        //console.log("Loading state of process engine");
        var doneLoading = function(error, loadedData) {
            test.deepEqual(
                loadedData,
                {
                    "processInstanceId": "myProcess::myPersistentProcess_1",
                    "data": {
                        "myprop": {
                            "an": "object"
                        }
                    },
                    "state": [
                        {
                            "bpmnId": "_3",
                            "name": "MyTask",
                            "type": "task",
                            "outgoingRefs": [
                                "_6"
                            ],
                            "incomingRefs": [
                                "_4"
                            ],
                            "waitForTaskDoneEvent": true
                        }
                    ],
                    "_id": 1
                },
                "testSimpleBPMNProcessPersistency: loaded data"
            );
            //console.log("Loaded data");

            var myProperty = newProcessEngine.getProperty(testPropertyName);
            test.deepEqual(
                myProperty,
                {
                    "an": "object"
                },
                "testSimpleBPMNProcessPersistency: get loaded property"
            );

            var deferredEvents = newProcessEngine.deferredEvents;
            test.deepEqual(deferredEvents,
                [
                    {
                        "type": "taskDoneEvent",
                        "name": "MyTask",
                        "data": {}
                    }
                ],
                "testSimpleBPMNProcessPersistency: deferred after loading");

            process.nextTick(function() {

                //console.log("Checking for end event");
                var state = newProcessEngine.getState();
                test.deepEqual(state,
                    [
                        {
                            "bpmnId": "_5",
                            "name": "MyEnd",
                            "type": "endEvent",
                            "outgoingRefs": [],
                            "incomingRefs": [
                                "_6"
                            ]
                        }
                    ],
                    "testSimpleBPMNProcessPersistency: end event"
                );
            });

            process.nextTick(function() {
                //console.log("Test Done");
                test.done();
            });

        };

        newProcessEngine.loadState(doneLoading);

        //console.log("Sending task done. NOTE: this event is to be deferred until loading is done!");
        newProcessEngine.taskDone("MyTask");

        var deferredEvents = newProcessEngine.deferredEvents;
        test.deepEqual(deferredEvents,
            [
                {
                    "type": "taskDoneEvent",
                    "name": "MyTask",
                    "data": {}
                }
            ],
            "testSimpleBPMNProcessPersistency: deferred events while loading");

    };

    process.nextTick(function() {
        //console.log("Start saving process");
        bpmnProcess.persist(doneSaving);
    });

 };