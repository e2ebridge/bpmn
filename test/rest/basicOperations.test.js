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

exports.testFindProcessesByProperty = function(test) {
    var client = createClient();
    client.get('/taskexampleprocess?myFirstProperty.gugus=blah', function(error, req, res, obj) {
        compareFindProcessesByPropertyResult(test, error, obj);
        client.close();
        test.done();
    });
};

exports.testFindProcessesByState = function(test) {
    var client = createClient();
    client.get('/taskexampleprocess?_state_=MyTask', function(error, req, res, obj) {
        compareFindProcessesByStateResult(test, error, obj);
        client.close();
        test.done();
    });
};

function sendEvent(test) {
    var startEvent = {
        _requestId_: "my_test_request_id",
        "MyStart": { // start event name
            "gugus": "blah"
        }
    };

    var client = createClient();
    client.put('/taskexampleprocess/_my_custom_id_1', startEvent, function(error, req, res, obj) {
        comparePutEventResult(test, error, obj);
        client.close();
        test.done();
    });
}

exports.testPutEvent = function(test) {
    sendEvent(test);
};

exports.testPutIdempotence = function(test) {
    // send exactly the same request again.
    sendEvent(test);
};

exports.testWrongPutEvent = function(test) {
    var startEvent = {
        "wrong": { // start event name
            "gugus": "blah"
        }
    };

    var client = createClient();
    client.put('/taskexampleprocess/_my_custom_id_1', startEvent, function(error, req, res, obj) {
        compareWrongPutEventResult(test, error, obj);
        client.close();
        test.done();
    });
};

exports.testNoBodyPutRequest = function(test) {
    var client = createClient();
    client.put('/taskexampleprocess/_my_custom_id_1', null, function(error, req, res, obj) {
        compareNoBodyPutRequestResult(test, error, obj);
        client.close();
        test.done();
    });
};

exports.testGetAllProcesses = function(test) {
    var client = createClient();
    client.get('/taskexampleprocess', function(error, req, res, obj) {
        compareGetAllProcessesResult(test, error, obj);
        client.close();
        closeServer(test);
    });
};

function compareCreateProcessResult(test, error, result) {

    test.ok(!error, "testBasicOperations: createProcess: noError");

    test.deepEqual(result,
        {
            "name": "TaskExampleProcess",
            "id": "_my_custom_id_0"
        },
        "testBasicOperations: createProcess: result"
    );
}

function compareCreateAnotherProcessResult(test, error, result) {

    test.ok(!error, "testBasicOperations: createProcess (2): noError");

    test.deepEqual(result,
        {
            "name": "TaskExampleProcess",
            "id": "_my_custom_id_1"
        },
        "testBasicOperations: createProcess (2): result"
    );
}

function compareGetProcessResult(test, error, result) {

    test.ok(!error, "testBasicOperations: getProcess: noError");

    test.deepEqual(result,
        {
            "id": "_my_custom_id_0",
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
            "data": {
                "myFirstProperty": {
                    "gugus": "blah"
                }
            }
        },
        "testBasicOperations: getProcess: result"
    );

}

function compareGetAllProcessesResult(test, error, result) {

    test.ok(!error, "testBasicOperations: getAllProcesses: noError");

    test.deepEqual(result,
        [
            {
                "id": "_my_custom_id_0",
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
                "data": {
                    "myFirstProperty": {
                        "gugus": "blah"
                    }
                }
            },
            {
                "id": "_my_custom_id_1",
                "state": {
                    "tokens": [
                        {
                            "position": "MyTask",
                            "owningProcessId": "_my_custom_id_1"
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
                "data": {
                    "myFirstProperty": {
                        "gugus": "blah"
                    }
                }
            }
        ],
        "testBasicOperations: getAllProcesses: result"
    );

}

function compareFindProcessesByPropertyResult(test, error, result) {

    test.ok(!error, "testBasicOperations: compareFindProcessesByPropertyResult: noError");

    test.deepEqual(result,
        [
            {
                "id": "_my_custom_id_0",
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
                "data": {
                    "myFirstProperty": {
                        "gugus": "blah"
                    }
                }
            }
        ],
        "testBasicOperations: compareFindProcessesByPropertyResult: result"
    );

}

function compareFindProcessesByStateResult(test, error, result) {

    test.ok(!error, "testBasicOperations: compareFindProcessesByStateResult: noError");

    test.deepEqual(result,
        [
            {
                "id": "_my_custom_id_0",
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
                "data": {
                    "myFirstProperty": {
                        "gugus": "blah"
                    }
                }
            }
        ],
        "testBasicOperations: compareFindProcessesByStateResult: result"
    );

}

function comparePutEventResult(test, error, result) {

    test.ok(!error, "testBasicOperations: comparePutEventResult: noError");

    test.deepEqual(result,
        {
            "id": "_my_custom_id_1",
            "state": {
                "tokens": [
                    {
                        "position": "MyTask",
                        "owningProcessId": "_my_custom_id_1"
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
            "data": {
                "myFirstProperty": {
                    "gugus": "blah"
                }
            }
        },
        "testBasicOperations: comparePutEventResult: result"
    );
}

function compareWrongPutEventResult(test, error) {

    test.ok(error !== undefined && error, "testBasicOperations: compareWrongPutEventResult: error occurred");

    test.deepEqual(error,
        {
            "message": "Error: The process 'TaskExampleProcess' does not know the event 'wrong'",
            "statusCode": 500,
            "body": {
                "code": "BPMNExecutionError",
                "message": "Error: The process 'TaskExampleProcess' does not know the event 'wrong'"
            },
            "restCode": "BPMNExecutionError",
            "name": "BPMNExecutionError"
        },
        "testBasicOperations: compareWrongPutEventResult: error"
    );
}

function compareNoBodyPutRequestResult(test, error) {

    test.ok(error !== undefined && error, "testBasicOperations: compareNoBodyPutRequestResult: error occurred");

    test.deepEqual(error,
        {
            "message": "PUT: no body found.",
            "statusCode": 409,
            "body": {
                "code": "InvalidArgument",
                "message": "PUT: no body found."
            },
            "restCode": "InvalidArgument",
            "name": "InvalidArgumentError"
        },
        "testBasicOperations: compareNoBodyPutRequestResult: error"
    );
}
