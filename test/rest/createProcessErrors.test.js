/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmn = require('../../lib/public.js');
var log = require('../../lib/logger');
var restify = require('restify');
var path = require('path');

var port = 8099;
var urlMap = {
    "TaskExampleProcess": path.join(__dirname, "../resources/projects/simple/taskExampleProcess.bpmn")
};

var server = bpmn.createServer({urlMap: urlMap, logLevel: log.logLevels.error});
var client = restify.createJsonClient({
    url: "http://localhost:" + port
});

exports.testWrongProcessName = function(test) {

     server.listen(port, function() {
         client.post('/unknownProcess', function(error) {
            if (error) {
                test.equal(error.statusCode, 409, "testWrongProcessName: statusCode");
                test.equal(error.restCode, "InvalidArgument", "testWrongProcessName: restCode");
                test.equal(error.message, "Could not map process name 'unknownProcess' to BPMN file.", "testWrongProcessName: message");
                test.deepEqual(error.body,
                    {
                        "code": "InvalidArgument",
                        "message": "Could not map process name 'unknownProcess' to BPMN file."
                    },
                    "testWrongProcessName: body");
            } else {
                test.ok(false, "testWrongProcessName: nok: no error occurred");
            }

            client.close();
            test.done();
        });
    });
};

exports.testWrongStartEvent = function(test) {
    client.post('/TaskExampleProcess/blah', function(error) {
        if (error) {
            test.equal(error.statusCode, 500, "testWrongProcessName: statusCode");
            test.equal(error.restCode, "BPMNExecutionError", "testWrongProcessName: restCode");
            test.equal(error.message, "Error: The process 'TaskExampleProcess' does not know the event 'blah'");
            test.deepEqual(error.body,
                {
                    "code": "BPMNExecutionError",
                    "message": "Error: The process 'TaskExampleProcess' does not know the event 'blah'"
                },
                "testWrongProcessName: body");
        } else {
            test.ok(false, "testWrongProcessName: nok: no error occurred");
        }

        client.close();
        server.close(function() {
            test.done();
        });
    });
};


