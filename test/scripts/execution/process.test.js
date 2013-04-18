/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fileUtilsModule = require('../../../lib/utils/file.js');
var pathModule = require('path');
var processModule = require('../../../lib/execution/process.js');

exports.testCreateVolatileBPMNProcess = function(test) {
    var state;

    var fileName = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var bpmnProcess = processModule.getBPMNProcess("myid", fileName);

    bpmnProcess.sendStartEvent("MyStart");

    process.nextTick(function() {
        //console.log("Comparing result after start event");
        state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask",
                    "substate": null,
                    "owningProcessId": "TaskExampleProcess::myid"
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

    var fileName = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var bpmnProcess = processModule.getBPMNProcess("myid", fileName, persistencyPath, loadedState);

    bpmnProcess.sendStartEvent("MyStart");
};


exports.testLoadHandler = function(test) {
    var handlerFilePath = processModule.getHandlerFileName("a/b/c.bpmn");
    test.equal(handlerFilePath, "a/b/c.js","testLoadHandler: handlerFilePath");

    var bpmnFilePath = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var handler = processModule.getHandler(bpmnFilePath);
    var myTaskHandler = handler["MyTask"];
    var foundMyTask = myTaskHandler && typeof myTaskHandler === 'function';
    test.equal(foundMyTask, true,"testLoadHandler");

    test.done();
};
