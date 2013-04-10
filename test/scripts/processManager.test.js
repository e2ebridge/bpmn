/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fileUtilsModule = require('../../lib/utils/file.js');
var processManagerModule = require('../../lib/processManager.js');
var ProcessManager = processManagerModule.ProcessManager;

exports.testCreateVolatileBPMNProcess = function(test) {
    var state;

    var bpmnProcess = processManagerModule.getBPMNProcess("myid","test/resources/projects/simpleBPMN/taskExampleProcess.bpmn");

    bpmnProcess.emitEvent("MyStart");

    process.nextTick(function() {
        //console.log("Comparing result after start event");
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
            "testCreateVolatileBPMNProcess: initial task"
        );
    });

    process.nextTick(function() {
        //console.log("Sending task done");
        bpmnProcess.taskDone("MyTask");
    });

    process.nextTick(function() {

        //console.log("Checking for end event");
        state = bpmnProcess.getState();
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
            "testCreateVolatileBPMNProcess: end event"
        );
    });

    process.nextTick(function() {
        //console.log("Test Done");
        test.done();
    });
};

exports.testCreatePersistentBPMNProcess = function(test) {
    var state;

    var persistencyPath = './test/resources/persistency/testPersistentProcess';
    fileUtilsModule.cleanDirectorySync(persistencyPath);

    var loadedState = function(error, loadedData) {
        //console.log("Comparing result after start event");
        state = bpmnProcess.getState();
        test.deepEqual(state,
            [],
            "testCreatePersistentBPMNProcess: current flowObjects are empty because all events have been deferred up to now."
        );

    };

    var bpmnProcess = processManagerModule.getBPMNProcess(
        "myid",
        "test/resources/projects/simpleBPMN/taskExampleProcess.bpmn",
        persistencyPath,
        loadedState);

    bpmnProcess.emitEvent("MyStart");

    bpmnProcess.taskDone("MyTask");

    bpmnProcess.onTaskDone(function(taskName) {

        test.equal(taskName, "MyTask", "testCreatePersistentBPMNProcess: done task name");

        //console.log("Checking for end event");

        state = bpmnProcess.getState();
        // NOTE: current state is still MyTask until taskDone finishes successfully
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
            "testCreatePersistentBPMNProcess: end event"
        );
        test.done();
    });
};

exports.testLoadBPMNProcess = function(test) {
    var processManager = new ProcessManager("test/resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var processes = processManager.getProcessDefinition();
    test.deepEqual(processes,
        {
            "bpmnId": "PROCESS_1",
            "name": "TaskExampleProcess",
            "tasks": [
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
            "startEvents": [
                {
                    "bpmnId": "_2",
                    "name": "MyStart",
                    "type": "startEvent",
                    "outgoingRefs": [
                        "_4"
                    ],
                    "incomingRefs": []
                }
            ],
            "endEvents": [
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
            "sequenceFlows": [
                {
                    "bpmnId": "_4",
                    "name": "flow1",
                    "type": "sequenceFlow",
                    "sourceRef": "_2",
                    "targetRef": "_3"
                },
                {
                    "bpmnId": "_6",
                    "name": "flow2",
                    "type": "sequenceFlow",
                    "sourceRef": "_3",
                    "targetRef": "_5"
                }
            ],
            "gateways": [],
            "processElementIndex": null,
            "nameMap": null
        },
        "testLoadBPMNProcess");

    test.done();
};

exports.testLoadHandler = function(test) {
    var processManager = new ProcessManager("test/resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var handler = processManager.getHandler();

    var myTaskHandler = handler["MyTask"];
    var foundMyTask = myTaskHandler && typeof myTaskHandler === 'function';
    test.equal(foundMyTask,
        true,
        "testLoadHandler");

    test.done();
};
