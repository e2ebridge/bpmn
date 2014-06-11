/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmn = require('../../../lib/public');
var Manager = require('../../../lib/manager').ProcessManager;
var rest = require('../../../lib/rest.js');
var restify = require('restify');
var path = require('path');

require("../../../lib/history.js").setDummyTimestampFunction();

bpmn.clearCache();
rest.clearReceivedMessageIds();

var port = 9099;
var counter = 0;

var manager = new Manager({
    bpmnFilePath: path.join(__dirname, "../../resources/projects/simpleUserTask/taskExampleProcess.bpmn")
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

exports.testCreateProcess1 = function(test) {
    server.listen(port, function() {
        var client = createClient();
        client.post('/TaskExampleProcess', function(error, req, res, obj) {
            compareCreateProcess1Result(test, error, res.statusCode, obj);
            client.close();
            test.done();
        });
    });
 };


exports.testCreateProcess2 = function(test) {
    var client = createClient();
    client.post('/TaskExampleProcess', function(error, req, res, obj) {
        compareCreateProcess2Result(test, error, res.statusCode, obj);
        client.close();
        test.done();
    });
};

exports.testPutEvent = function(test) {
    var client = createClient();
    client.put('/TaskExampleProcess/_my_custom_id_0/MyStart/_my_message_id_0', {"gugus": "blah"}, function(error, req, res, obj) {
        comparePutEventResult(test, error, res.statusCode, obj);
        client.close();
        test.done();
    });
};

exports.testIdempotentPut = function(test) {
    var client = createClient();
    client.put('/TaskExampleProcess/_my_custom_id_0/MyStart/_my_message_id_0', {"gugus": "blah"}, function(error, req, res, obj) {
        compareIdempotentPutEventResult(test, error, res.statusCode, obj);
        client.close();
        test.done();
    });
};

exports.testPutTaskDone = function(test) {
    var client = createClient();
    client.put('/TaskExampleProcess/_my_custom_id_0/MyTaskDone/_my_task_done_id_0', {"gugus": "blah"}, function(error, req, res, obj) {
        comparePutTaskDoneResult(test, error, res.statusCode, obj);
        client.close();
        test.done();
    });
};

exports.testPutUnknownMessage = function(test) {
    var client = createClient();
    client.put('/TaskExampleProcess/_my_custom_id_1/wrong/_my_message_id_1', {"gugus": "blah"}, function(error, req, res, obj) {
        comparePutUnknownMessageResult(test, error, obj);
        client.close();
        test.done();
    });
};

exports.testPutMessageWithoutProvidingMessageId = function(test) {
    var client = createClient();
    client.put('/TaskExampleProcess/_my_custom_id_1/MyStart', {"gugus": "blah"}, function(error, req, res, obj) {
        comparePutMessageWithoutProvidingMessageIdResult(test, error, obj);
        client.close();
        test.done();
    });
};

exports.testNoBodyPutRequest = function(test) {
    var client = createClient();
    client.put('/TaskExampleProcess/_my_custom_id_1/MyStart/_my_message_id_1', null, function(error, req, res, obj) {
        compareNoBodyPutRequestResult(test, error, res.statusCode, obj);
        client.close();
        closeServer(test);
    });
};

function compareCreateProcess1Result(test, error, statusCode, result) {

    test.ok(!error, "compareCreateProcess1Result: noError");

    test.equal(statusCode, 201, "compareCreateProcess1Result: statusCode");

    test.deepEqual(result,
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
        "compareCreateProcess1Result: result"
    );
}

function compareCreateProcess2Result(test, error, statusCode, result) {

    test.ok(!error, "compareCreateProcess2Result: noError");

    test.equal(statusCode, 201, "compareCreateProcess2Result: statusCode");

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
        "compareCreateProcess2Result: result"
    );
}

function comparePutEventResult(test, error, statusCode, result) {

    test.ok(!error, "comparePutEventResult: noError");

    test.equal(statusCode, 201, "comparePutEventResult: statusCode");

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
                    "type": "userTask",
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
        "comparePutEventResult: result"
    );
}

function comparePutTaskDoneResult(test, error, statusCode, result) {

    test.ok(!error, "comparePutTaskDoneResult: noError");

    test.equal(statusCode, 201, "comparePutTaskDoneResult: statusCode");

    test.deepEqual(result,
        {
            "id": "_my_custom_id_0",
            "name": "TaskExampleProcess",
            "link": {
                "rel": "self",
                "href": "/TaskExampleProcess/_my_custom_id_0"
            },
            "state": [],
            "history": [
                {
                    "name": "MyStart",
                    "type": "startEvent",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "MyTask",
                    "type": "userTask",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "MyEnd",
                    "type": "endEvent",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                }
            ],
            "properties": {
                "myFirstProperty": {
                    "gugus": "blah"
                }
            }
        },
        "comparePutTaskDoneResult: result"
    );
}

function compareIdempotentPutEventResult(test, error, statusCode, result) {

    test.ok(!error, "compareIdempotentPutEventResult: noError");

    test.equal(statusCode, 200, "compareIdempotentPutEventResult: statusCode");

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
                    "type": "userTask",
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
        "compareIdempotentPutEventResult: result"
    );
}

function comparePutUnknownMessageResult(test, error) {

    test.ok(error !== undefined && error, "comparePutUnknownMessageResult: error occurred");

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
        "comparePutUnknownMessageResult: error"
    );
}

function comparePutMessageWithoutProvidingMessageIdResult(test, error) {

    test.ok(error !== undefined && error, "comparePutMessageWithoutProvidingMessageIdResult: error occurred");

    test.deepEqual(error,
        {
            "message": "/TaskExampleProcess/_my_custom_id_1/MyStart does not exist",
            "statusCode": 404,
            "body": {
                "code": "ResourceNotFound",
                "message": "/TaskExampleProcess/_my_custom_id_1/MyStart does not exist"
            },
            "restCode": "ResourceNotFound",
            "name": "ResourceNotFoundError"
        },
        "comparePutMessageWithoutProvidingMessageIdResult: error"
    );
}

function compareNoBodyPutRequestResult(test, error, statusCode, result) {

    test.ok(!error, "compareNoBodyPutRequestResult: noError");

    test.equal(statusCode, 201, "compareNoBodyPutRequestResult: statusCode");

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
                    "type": "userTask",
                    "begin": "_dummy_ts_",
                    "end": null
                }
            ],
            "properties": {
                "myFirstProperty": {}
            }
        },
        "compareNoBodyPutRequestResult: result"
    );
}