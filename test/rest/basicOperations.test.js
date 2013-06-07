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

// NOTE: SERVER IS CLOSED IN THE LAST TEST OPERATION
function closeServer(test) {
    server.close(function() {
        test.done();
    });
}

function createClient() {
    return restify.createJsonClient({url: "http://localhost:" + port});
}

exports.testBasicOperations = function(test) {

    server.listen(port, function() {

        var startEvent = {
            "MyStart": { // start event name
                "gugus": "blah"
            }
        };

        var client = createClient();
        client.post('/taskexampleprocess', startEvent, function(error, req, res, obj) {
            compareCreateProcessResult(test, error, obj);
            client.close();
            test.done();
        });
    });
};

exports.testGetProcess = function(test) {
    var client = createClient();
    client.get('/taskexampleprocess/_my_custom_id_0', function(error, req, res, obj) {
        compareGetProcessResult(test, error, obj);
        client.close();
        test.done();
     });
};

exports.testCreateAnotherProcess = function(test) {
    var client = createClient();
    client.post('/taskexampleprocess', function(error, req, res, obj) {
        compareCreateAnotherProcessResult(test, error, obj);
        client.close();
        test.done();
    });
};

exports.testGetProcesses = function(test) {
    var client = createClient();
    client.get('/taskexampleprocess', function(error, req, res, obj) {
        compareGetProcessesResult(test, error, obj);
        client.close();
        closeServer(test);
    });
};

function compareCreateProcessResult(test, error, result) {

    test.ok(!error, "testBasicOperations: createProcess: noError");

    test.deepEqual(result,
        {
            "processId": "_my_custom_id_0"
        },
        "testBasicOperations: createProcess: result"
    );
}

function compareCreateAnotherProcessResult(test, error, result) {

    test.ok(!error, "testBasicOperations: createProcess (2): noError");

    test.deepEqual(result,
        {
            "processId": "_my_custom_id_1"
        },
        "testBasicOperations: createProcess (2): result"
    );
}

function compareGetProcessResult(test, error, result) {

    test.ok(!error, "testBasicOperations: getProcess: noError");

    test.deepEqual(result,
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
        "testBasicOperations: getProcess: result"
    );

}

function compareGetProcessesResult(test, error, result) {

    test.ok(!error, "testBasicOperations: getProcesses: noError");

    test.deepEqual(result,
        [
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
            {
                "state": {
                    "tokens": []
                },
                "history": {
                    "historyEntries": []
                },
                "data": {}
            }
        ],
        "testBasicOperations: getProcesses: result"
    );

}