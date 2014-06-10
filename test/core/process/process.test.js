/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var bpmn = require('../../../lib/public.js');

exports.testCreateVolatileBPMNProcess = function(test) {
    var state;

    var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    bpmn.createProcess("myid", fileName, function(err, bpmnProcess){
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
    });

};

