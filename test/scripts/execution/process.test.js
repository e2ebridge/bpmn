/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var processModule = require('../../../lib/process.js');

exports.testCreateVolatileBPMNProcess = function(test) {
    var state;

    var fileName = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var bpmnProcess = processModule.createBPMNProcess("myid", fileName);

    bpmnProcess.sendStartEvent("MyStart");

    process.nextTick(function() {
        //console.log("Comparing result after start event");
        state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask",
                    "substate": null,
                    "owningProcessId": "myid"
                }
            ],
            "testCreateVolatileBPMNProcess: reached first wait state."
        );

        test.done();
    });
};

