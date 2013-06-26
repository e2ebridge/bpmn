/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

var path = require('path');
var publicModule = require('../../lib/public.js');
var BPMNProcessDefinition = require('../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

require("../../lib/history.js").setDummyTimestampFunction();

var mongodb = require('mongodb');
var persistencyUri = 'mongodb://127.0.0.1:27017/processtestdb';
var bpmnFileName = path.join(__dirname, "../resources/projects/simple/taskExampleProcess.bpmn");

var bpmnProcess1, bpmnProcess2;

exports.resetMongoDb = function(test) {
    publicModule.clearCache();
    mongodb.MongoClient.connect(persistencyUri, function(err, db) {
        db.dropDatabase(function(err) {
            db.close();
            test.done();
        });
    });
};

exports.testMongoDBPersistProcess1 = function(test) {
    var doneSaving = function(error) {
        test.ok(error === null, "testMongoDBPersistProcess1: no error saving.");
        test.done();
    };

    bpmnProcess1 = publicModule.createProcess("myid1", bpmnFileName, {
        uri: persistencyUri,
        doneSaving: doneSaving
    });

    // we let the process run to the first save state
    bpmnProcess1.triggerEvent("MyStart");
};

exports.testMongoDBAfterPersistingProcess1 = function(test) {
    mongodb.MongoClient.connect(persistencyUri, function(err, db) {
        var collection = db.collection('TaskExampleProcess');
        collection.find().toArray(function(err, results) {
            db.close();

            test.ok(results[0]._id !== undefined, "testMongoDBAfterPersistingProcess1: _id 1 exists");
            results[0]._id = "_dummy_id_";

            test.deepEqual(results,
                [
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid1",
                        "parentToken": null,
                        "data": {
                            "myFirstProperty": {}
                        },
                        "state": {
                            "tokens": [
                                {
                                    "position": "MyTask",
                                    "owningProcessId": "myid1"
                                }
                            ]
                        },
                        "history": {
                            "historyEntries": [
                                {
                                    "name": "MyStart",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyTask",
                                    "begin": "_dummy_ts_",
                                    "end": null
                                }
                            ],
                            "createdAt": "_dummy_ts_"
                        },
                        "pendingTimeouts": {}
                    }
                ],
                "testMongoDBAfterPersistingProcess1");

            test.done();
        });
    });
};

exports.testMongoDBPersistProcess2 = function(test) {
    var doneSaving = function(error) {
        test.ok(error === null, "testMongoDBPersistProcess2: no error saving.");
        test.done();
    };

    bpmnProcess2 = publicModule.createProcess("myid2", bpmnFileName, {
        uri: persistencyUri,
        doneSaving: doneSaving
    });

    // we let the process run to the first save state
    bpmnProcess2.triggerEvent("MyStart");
};

exports.testMongoDBAfterPersistingProcess2 = function(test) {
    mongodb.MongoClient.connect(persistencyUri, function(err, db) {
        var collection = db.collection('TaskExampleProcess');
        collection.find().toArray(function(err, results) {
            db.close();

            test.ok(results[0]._id !== undefined, "testMongoDBAfterPersistingProcess2: _id 1 exists");
            results[0]._id = "_dummy_id_";

            test.ok(results[1]._id !== undefined, "testMongoDBAfterPersistingProcess2: _id 2 exists");
            results[1]._id = "_dummy_id_";

            test.deepEqual(results,
                [
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid1",
                        "parentToken": null,
                        "data": {
                            "myFirstProperty": {}
                        },
                        "state": {
                            "tokens": [
                                {
                                    "position": "MyTask",
                                    "owningProcessId": "myid1"
                                }
                            ]
                        },
                        "history": {
                            "historyEntries": [
                                {
                                    "name": "MyStart",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyTask",
                                    "begin": "_dummy_ts_",
                                    "end": null
                                }
                            ],
                            "createdAt": "_dummy_ts_"
                        },
                        "pendingTimeouts": {}
                    },
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid2",
                        "parentToken": null,
                        "data": {
                            "myFirstProperty": {}
                        },
                        "state": {
                            "tokens": [
                                {
                                    "position": "MyTask",
                                    "owningProcessId": "myid2"
                                }
                            ]
                        },
                        "history": {
                            "historyEntries": [
                                {
                                    "name": "MyStart",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyTask",
                                    "begin": "_dummy_ts_",
                                    "end": null
                                }
                            ],
                            "createdAt": "_dummy_ts_"
                        },
                        "pendingTimeouts": {}
                    }
                ],
                "testMongoDBAfterPersistingProcess2");

            test.done();

        });


    });
};

exports.testMongoDBPersistentProcess2_persistAtEnd = function(test) {
    // we let the process run to the very end
    bpmnProcess2.taskDone("MyTask");
    // test.done(); this called in the doneSaving handler
};

exports.testMongoDBAfterEndOfProcess2 = function(test) {
    mongodb.MongoClient.connect(persistencyUri, function(err, db) {
        var collection = db.collection('TaskExampleProcess');
        collection.find().toArray(function(err, results) {
            db.close();

            test.ok(results[0]._id !== undefined, "testMongoDBAfterEndOfProcess2: _id 1 exists");
            results[0]._id = "_dummy_id_";

            test.ok(results[1]._id !== undefined, "testMongoDBAfterEndOfProcess2: _id 2 exists");
            results[1]._id = "_dummy_id_";

            test.deepEqual(results,
                [
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid1",
                        "parentToken": null,
                        "data": {
                            "myFirstProperty": {}
                        },
                        "state": {
                            "tokens": [
                                {
                                    "position": "MyTask",
                                    "owningProcessId": "myid1"
                                }
                            ]
                        },
                        "history": {
                            "historyEntries": [
                                {
                                    "name": "MyStart",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyTask",
                                    "begin": "_dummy_ts_",
                                    "end": null
                                }
                            ],
                            "createdAt": "_dummy_ts_"
                        },
                        "pendingTimeouts": {}
                    },
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid2",
                        "parentToken": null,
                        "data": {
                            "myFirstProperty": {}
                        },
                        "state": {
                            "tokens": []
                        },
                        "history": {
                            "historyEntries": [
                                {
                                    "name": "MyStart",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyTask",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyEnd",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                }
                            ],
                            "createdAt": "_dummy_ts_"
                        },
                        "pendingTimeouts": {}
                    }
                ],
                "testMongoDBAfterEndOfProcess2");

            test.done();

        });
    });
};

exports.closeConnections = function(test) {
    bpmnProcess2.closeConnection(function() {
        bpmnProcess1.closeConnection(function() {
           test.done();
        });
    });
};
