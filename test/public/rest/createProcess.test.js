/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmn = require('../../../lib/public');
var Manager = require('../../../lib/manager').ProcessManager;
var restify = require('restify');
var path = require('path');

bpmn.clearCache();

var port = 8099;
var counter = 0;

var manager = new Manager({
    bpmnFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn")
});
var server = manager.createServer({ logLevel: bpmn.logLevels.error, createProcessId: function() {
    return ("_my_custom_id_" + counter++);
}});

exports.testCreateProcessByREST = function(test) {

    server.listen(port, function() {
        //console.log('%s listening at %s', server.name, server.url);

        var client = restify.createJsonClient({url: "http://localhost:" + port});
        client.post('/taskexampleprocess', function(err, req, res, obj) {
            test.ok(!err, "testCreateProcessByREST: noError");

            test.deepEqual(obj,
                {
                    "id": "_my_custom_id_0",
                    "name": "TaskExampleProcess",
                    "link": {
                        "rel": "self",
                        "href": "/TaskExampleProcess/_my_custom_id_0"
                    },
                    "state": [],
                    "history": [],
                    "properties": {}
                },
                "testCreateProcessByREST: response object"
            );

            client.close();
            server.close(function() {
                test.done();
            });
        });
    });
};


