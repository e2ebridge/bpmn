/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var publicModule = require('../../../lib/public.js');

exports.testCreateVolatileBPMNProcess = function(test) {
    var state;

    var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    publicModule.clearCache();
    var bpmnProcess = publicModule.createProcess("myid", fileName);

    bpmnProcess.triggerEvent("MyStart");

    process.nextTick(function() {
        //console.log("Comparing result after start event");
        state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask",
                    "owningProcessId": "myid"
                }
            ],
            "testCreateVolatileBPMNProcess: reached first wait state."
        );

        test.done();
    });
};

