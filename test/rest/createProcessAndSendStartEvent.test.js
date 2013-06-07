/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmn = require('../../lib/public.js');
var restify = require('restify');
var pathModule = require('path');

var port = 8099;
var urlMap = {
    "TaskExampleProcess": pathModule.join(__dirname, "../resources/projects/simple/taskExampleProcess.bpmn")
};
var counter = 0;
var getProcessId = function() {
  return ("_my_custom_id_" + counter++);
};

var server = bpmn.createServer({urlMap: urlMap, logLevel: bpmn.logLevels.error, getProcessId: getProcessId});

exports.testCreateProcessAndSendStartEvent = function(test) {

    server.listen(port, function() {
        //console.log('%s listening at %s', server.name, server.url);

        var startEvent = {
            "MyStart": { // start event name
                "gugus": "blah"
            }
        };

        var client = restify.createJsonClient({url: "http://localhost:" + port});
        client.post('/taskexampleprocess', startEvent, function(err, req, res, obj) {
            test.ok(!err, "testCreateProcessAndSendStartEvent: noError");

            test.deepEqual(obj,
                {
                    "processId": "_my_custom_id_0"
                },
                "testCreateProcessAndSendStartEvent: response object"
            );

            client.get('/taskexampleprocess/_my_custom_id_0', function(err, req, res, obj) {
                test.ok(!err, "testCreateProcessAndSendStartEvent: noError");

                test.deepEqual(obj,
                    {
                        "state": {
                            "tokens": [
                                {
                                    "position": "MyTask",
                                    "owningProcessId": "_my_custom_id_0"
                                }
                            ]
                        },
                        "history": {
                            "historyEntries": [
                                {
                                    "name": "MyStart"
                                },
                                {
                                    "name": "MyTask"
                                }
                            ]
                        },
                        "data": {}
                    },
                    "testCreateProcessAndSendStartEvent: process state"
                );

                client.close();
                server.close(function() {
                    test.done();
                });
            });

        });
    });
};


