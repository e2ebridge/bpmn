/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmn = require('../../lib/public.js');
var logModule = require('../../lib/logger');
var restify = require('restify');
var pathModule = require('path');

var port = 8099;
var urlMap = {
    "myProcess": pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn")
};

var server = bpmn.createServer({urlMap: urlMap, logLevel: logModule.logLevels.error});

exports.testWrongProcessName = function(test) {

     server.listen(port, function() {
        //console.log('%s listening at %s', server.name, server.url);

        var client = restify.createJsonClient({
            url: "http://localhost:" + port
        });

        client.post('/unknownProcess', function(error, req, res, obj) {
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
            server.close(function() {
                //console.log("\nstopping server on port " + port);
                test.done();
            });
        });
    });
};


