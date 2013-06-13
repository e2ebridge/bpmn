/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmn = require('../../lib/public.js');
var restify = require('restify');
var pathModule = require('path');

bpmn.clearCache();

var port = 8099;
var urlMap = {
    "TaskExampleProcess": pathModule.join(__dirname, "../resources/projects/simple/taskExampleProcess.bpmn")
};
var counter = 0;
var server = bpmn.createServer({urlMap: urlMap, logLevel: bpmn.logLevels.error, createProcessId: function() {
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
                    "name": "TaskExampleProcess",
                    "id": "_my_custom_id_0"
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


