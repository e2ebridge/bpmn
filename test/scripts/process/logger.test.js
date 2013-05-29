/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var publicModule = require('../../../lib/public.js');
var LogLevels = require('../../../lib/logger.js').logLevels;

exports.testLogger = function(test) {
    var state;

    var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    publicModule.clearCache();
    var bpmnProcess = publicModule.createProcess("myid", fileName);

    var logMessages = [];
    var logAppender = function(logMessage) {
        logMessages.push(logMessage);
    };

    bpmnProcess.setLogLevel(logLevels.debug);
    bpmnProcess.setLogAppender(logAppender);

    bpmnProcess.triggerEvent("MyStart");

    process.nextTick(function() {
        test.deepEqual(logMessages,
            [
                "[trace][TaskExampleProcess][myid][Trigger startEvent 'MyStart']",
                "[debug][TaskExampleProcess][myid][Token was put on 'MyStart']",
                "[debug][TaskExampleProcess][myid][Token arrived at startEvent 'MyStart'][{}]",
                "[debug][TaskExampleProcess][myid][Token was put on 'MyTask'][{}]",
                "[debug][TaskExampleProcess][myid][Token arrived at task 'MyTask'][{}]"
            ],
            "testLogger"
        );

        test.done();
    });
};

