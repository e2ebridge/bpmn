/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var publicModule = require('../../../lib/public.js');
var LogLevel = require('../../../lib/logger.js').ProcessLogLevel;

exports.testLogger = function(test) {
    var state;

    var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    publicModule.clearCache();
    var bpmnProcess = publicModule.createProcess("myid", fileName);

    var logMessages = [];
    var logAppender = function(logMessage) {
        logMessages.push(logMessage);
    };

    bpmnProcess.setLogLevel(LogLevel.Debug);
    bpmnProcess.setLogAppender(logAppender);

    bpmnProcess.triggerEvent("MyStart");

    process.nextTick(function() {
        test.deepEqual(logMessages,
            [
                "[Trace][TaskExampleProcess][myid][Trigger startEvent 'MyStart']\n",
                "[Debug][TaskExampleProcess][myid][Token was put on 'MyStart']\n",
                "[Debug][TaskExampleProcess][myid][Token arrived at startEvent 'MyStart'][{}]\n",
                "[Debug][TaskExampleProcess][myid][Token was put on 'MyTask'][{}]\n",
                "[Debug][TaskExampleProcess][myid][Token arrived at task 'MyTask'][{}]\n"
            ],
            "testLogger"
        );

        test.done();
    });
};

