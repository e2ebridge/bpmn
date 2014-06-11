/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmn = require('../../../lib/public');
var Manager = require('../../../lib/manager').ProcessManager;
var restify = require('restify');
var path = require('path');

require("../../../lib/history.js").setDummyTimestampFunction();

var port = 8099;
var counter = 0;

var manager = new Manager({
    bpmnFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn")
});
var server = manager.createServer({ logLevel: bpmn.logLevels.error, createProcessId: function() {
    return ("_my_custom_id_" + counter++);
}});

// NOTE: SERVER IS CLOSED IN THE LAST TEST OPERATION
// NOTE2: Couldn't use setUp, tearDown, because they are called for each test case!
function closeServer(test) {
    server.close(function() {
        test.done();
    });
}

function createClient() {
    return restify.createJsonClient({url: "http://localhost:" + port});
}

exports.testCreateProcess = function(test) {

    server.listen(port, function() {

        var startEventMessage = {
            "gugus": "blah"
        };

        var client = createClient();
         client.post('/TaskExampleProcess/MyStart', startEventMessage, function(error, req, res, obj) {
            compareCreateProcessResult(test, error, res.statusCode, obj);
            client.close();
            test.done();
        });
    });
};

exports.testGetProcess = function(test) {
    var client = createClient();
    client.get('/TaskExampleProcess/_my_custom_id_0', function(error, req, res, obj) {
        compareGetProcessResult(test, error, res.statusCode, obj);
        client.close();
        test.done();
     });
};

exports.testCreateAnotherProcess = function(test) {
    var client = createClient();
    client.post('/TaskExampleProcess', function(error, req, res, obj) {
        compareCreateAnotherProcessResult(test, error, res.statusCode, obj);
        client.close();
        test.done();
    });
};

exports.testFindProcessesByProperty = function(test) {
    var client = createClient();
    client.get('/TaskExampleProcess?myFirstProperty.gugus=blah', function(error, req, res, obj) {
        compareFindProcessesByPropertyResult(test, error, obj);
        client.close();
        test.done();
    });
};

exports.testFindProcessesByState = function(test) {
    var client = createClient();
    client.get('/TaskExampleProcess?state=MyTask', function(error, req, res, obj) {
        compareFindProcessesByStateResult(test, error, obj);
        client.close();
        test.done();
    });
};

exports.testPutEvent = function(test) {
    var message = {
        "gugus": "blah"
    };

    var client = createClient();
    client.put('/TaskExampleProcess/_my_custom_id_1/MyStart/_my_message_id_1', message, function(error, req, res, obj) {
        comparePutEventResult(test, error, res.statusCode, obj);
        client.close();
        test.done();
    });
};

exports.testGetAllProcesses = function(test) {
    var client = createClient();
    client.get('/TaskExampleProcess', function(error, req, res, obj) {
        compareGetAllProcessesResult(test, error, obj);
        client.close();
        closeServer(test);
    });
};

function compareCreateProcessResult(test, error, statusCode, result) {

    test.ok(!error, "testBasicOperations: createProcess: noError");

    test.equal(statusCode, 201, "testBasicOperations: createProcess: statusCode");

    test.deepEqual(result,
        {
            "id": "_my_custom_id_0",
            "name": "TaskExampleProcess",
            "link": {
                "rel": "self",
                "href": "/TaskExampleProcess/_my_custom_id_0"
            },
            "state": [
                {
                    "position": "MyTask",
                    "owningProcessId": "_my_custom_id_0"
                }
            ],
            "history": [
                {
                    "name": "MyStart",
                    "type": "startEvent",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "MyTask",
                    "type": "task",
                    "begin": "_dummy_ts_",
                    "end": null
                }
            ],
            "properties": {
                "myFirstProperty": {
                    "gugus": "blah"
                }
            }
        },
        "testBasicOperations: createProcess: result"
    );
}

function compareGetProcessResult(test, error, statusCode, result) {

    test.ok(!error, "testBasicOperations: getProcess: noError");

    test.equal(statusCode, 200, "testBasicOperations: createProcess: statusCode");

    test.deepEqual(result,
        {
            "id": "_my_custom_id_0",
            "name": "TaskExampleProcess",
            "link": {
                "rel": "self",
                "href": "/TaskExampleProcess/_my_custom_id_0"
            },
            "state": [
                {
                    "position": "MyTask",
                    "owningProcessId": "_my_custom_id_0"
                }
            ],
            "history": [
                {
                    "name": "MyStart",
                    "type": "startEvent",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "MyTask",
                    "type": "task",
                    "begin": "_dummy_ts_",
                    "end": null
                }
            ],
            "properties": {
                "myFirstProperty": {
                    "gugus": "blah"
                }
            }
        },
        "testBasicOperations: getProcess: result"
    );

}

function compareCreateAnotherProcessResult(test, error, statusCode, result) {

    test.ok(!error, "testBasicOperations: createProcess (2): noError");

    test.equal(statusCode, 201, "testBasicOperations: createProcess: statusCode");

    test.deepEqual(result,
        {
            "id": "_my_custom_id_1",
            "name": "TaskExampleProcess",
            "link": {
                "rel": "self",
                "href": "/TaskExampleProcess/_my_custom_id_1"
            },
            "state": [],
            "history": [],
            "properties": {}
        },
        "testBasicOperations: createProcess (2): result"
    );
}

function compareGetAllProcessesResult(test, error, result) {

    test.ok(!error, "testBasicOperations: getAllProcesses: noError");

    test.deepEqual(result,
        [
            {
                "id": "_my_custom_id_0",
                "name": "TaskExampleProcess",
                "link": {
                    "rel": "self",
                    "href": "/TaskExampleProcess/_my_custom_id_0"
                },
                "state": [
                    {
                        "position": "MyTask",
                        "owningProcessId": "_my_custom_id_0"
                    }
                ],
                "history": [
                    {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyTask",
                        "type": "task",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "properties": {
                    "myFirstProperty": {
                        "gugus": "blah"
                    }
                }
            },
            {
                "id": "_my_custom_id_1",
                "name": "TaskExampleProcess",
                "link": {
                    "rel": "self",
                    "href": "/TaskExampleProcess/_my_custom_id_1"
                },
                "state": [
                    {
                        "position": "MyTask",
                        "owningProcessId": "_my_custom_id_1"
                    }
                ],
                "history": [
                    {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyTask",
                        "type": "task",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "properties": {
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
                "name": "TaskExampleProcess",
                "link": {
                    "rel": "self",
                    "href": "/TaskExampleProcess/_my_custom_id_0"
                },
                "state": [
                    {
                        "position": "MyTask",
                        "owningProcessId": "_my_custom_id_0"
                    }
                ],
                "history": [
                    {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyTask",
                        "type": "task",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "properties": {
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
                "name": "TaskExampleProcess",
                "link": {
                    "rel": "self",
                    "href": "/TaskExampleProcess/_my_custom_id_0"
                },
                "state": [
                    {
                        "position": "MyTask",
                        "owningProcessId": "_my_custom_id_0"
                    }
                ],
                "history": [
                    {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    {
                        "name": "MyTask",
                        "type": "task",
                        "begin": "_dummy_ts_",
                        "end": null
                    }
                ],
                "properties": {
                    "myFirstProperty": {
                        "gugus": "blah"
                    }
                }
            }
        ],
        "testBasicOperations: compareFindProcessesByStateResult: result"
    );

}

function comparePutEventResult(test, error, statusCode, result) {

    test.ok(!error, "testBasicOperations: comparePutEventResult: noError");

    test.equal(statusCode, 201, "testBasicOperations: comparePutEventResult: statusCode");

    test.deepEqual(result,
        {
            "id": "_my_custom_id_1",
            "name": "TaskExampleProcess",
            "link": {
                "rel": "self",
                "href": "/TaskExampleProcess/_my_custom_id_1"
            },
            "state": [
                {
                    "position": "MyTask",
                    "owningProcessId": "_my_custom_id_1"
                }
            ],
            "history": [
                {
                    "name": "MyStart",
                    "type": "startEvent",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "MyTask",
                    "type": "task",
                    "begin": "_dummy_ts_",
                    "end": null
                }
            ],
            "properties": {
                "myFirstProperty": {
                    "gugus": "blah"
                }
            }
        },
        "testBasicOperations: comparePutEventResult: result"
    );
}
