/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fileUtilsModule = require('../../lib/utils/file.js');
var processManagerModule = require('../../lib/processManager.js');
var ProcessManager = processManagerModule.ProcessManager;

exports.testCreateVolatileBPMNProcess = function(test) {
    var state;

    var bpmnProcess = processManagerModule.getBPMNProcessDefinition("myid","test/resources/projects/simpleBPMN/taskExampleProcess.bpmn");

    bpmnProcess.sendStartEvent("MyStart");

    process.nextTick(function() {
        //console.log("Comparing result after start event");
        state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask"
                }
            ],
            "testCreateVolatileBPMNProcess: reached first wait state."
        );

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
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyStart"
                }
            ],
            "testCreatePersistentBPMNProcess: reached start state."
        );

        process.nextTick(function() {
            //console.log("Comparing result after start event");
            state = bpmnProcess.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask"
                    }
                ],
                "testCreatePersistentBPMNProcess: reached first wait state."
            );

            test.done();
        });
    };

    var bpmnProcess = processManagerModule.getBPMNProcessDefinition(
        "myid",
        "test/resources/projects/simpleBPMN/taskExampleProcess.bpmn",
        persistencyPath,
        loadedState);

    bpmnProcess.sendStartEvent("MyStart");
};

exports.testLoadBPMNProcess = function(test) {
    var processManager = new ProcessManager("test/resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var processes = processManager.getProcessDefinition();
    test.deepEqual(processes,
        {
            "bpmnId": "PROCESS_1",
            "name": "TaskExampleProcess",
            "flowObjects": [
                {
                    "bpmnId": "_2",
                    "name": "MyStart",
                    "type": "startEvent",
                    "isFlowObject": true,
                    "isStartEvent": true
                },
                {
                    "bpmnId": "_3",
                    "name": "MyTask",
                    "type": "task",
                    "isFlowObject": true,
                    "boundaryEvents": [],
                    "isActivity": true,
                    "hasBoundaryEvents": false,
                    "waitForTaskDoneEvent": true
                },
                {
                    "bpmnId": "_5",
                    "name": "MyEnd",
                    "type": "endEvent",
                    "isFlowObject": true,
                    "isEndEvent": true
                }
            ],
            "sequenceFlows": [
                {
                    "bpmnId": "_4",
                    "name": "flow1",
                    "type": "sequenceFlow",
                    "sourceRef": "_2",
                    "targetRef": "_3",
                    "isSequenceFlow": true
                },
                {
                    "bpmnId": "_6",
                    "name": "flow2",
                    "type": "sequenceFlow",
                    "sourceRef": "_3",
                    "targetRef": "_5",
                    "isSequenceFlow": true
                }
            ],
            "processElementIndex": null,
            "sequenceFlowBySourceIndex": null,
            "sequenceFlowByTargetIndex": null,
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
