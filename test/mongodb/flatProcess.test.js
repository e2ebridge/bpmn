/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var bpmn = require('../../lib/public.js');

require("../../lib/history.js").setDummyTimestampFunction();

var mongodb = require('mongodb');
var persistencyUri = 'mongodb://127.0.0.1:27017/ut_flatprocess';
var bpmnFileName = path.join(__dirname, "../resources/projects/simple/taskExampleProcess.bpmn");

var bpmnProcess1, bpmnProcess2;

var executionTrace = [];
var logger = {
    trace: function(message) {
        executionTrace.push(message);
    }
};

exports.resetMongoDb = function(test) {
    bpmn.clearCache();
    mongodb.MongoClient.connect(persistencyUri, function(err, db) {
        db.dropDatabase(function() {
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

    bpmnProcess1 = bpmn.createProcess("myid1", bpmnFileName, {
        uri: persistencyUri,
        doneSaving: doneSaving,
        logger: logger
    });

    // we let the process run to the first save state
    bpmnProcess1.triggerEvent("MyStart");
};

exports.testMongoDBAfterPersistingProcess1 = function(test) {
    mongodb.MongoClient.connect(persistencyUri, function(err, db) {
        var collection = db.collection('TaskExampleProcess');
        collection.find().toArray(function(err, results) {
            db.close();

            test.ok(results[0] !== undefined, "testMongoDBAfterPersistingProcess1: got results");

            test.ok(results[0]._id !== undefined, "testMongoDBAfterPersistingProcess1: _id 1 exists");
            results[0]._id = "_dummy_id_";

            test.deepEqual(results,
                [
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid1",
                        "parentToken": null,
                        "properties": {
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
                            "createdAt": "_dummy_ts_",
                            "finishedAt": null
                        },
                        "pendingTimeouts": {},
                        "views": {
                            "startEvent": {
                                "name": "MyStart",
                                "type": "startEvent",
                                "begin": "_dummy_ts_",
                                "end": "_dummy_ts_"
                            },
                            "endEvent": null,
                            "duration": null
                        }
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

    bpmnProcess2 = bpmn.createProcess("myid2", bpmnFileName, {
        uri: persistencyUri,
        doneSaving: doneSaving,
        logger: logger
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
                        "properties": {
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
                            "createdAt": "_dummy_ts_",
                            "finishedAt": null
                        },
                        "pendingTimeouts": {},
                        "views": {
                            "startEvent": {
                                "name": "MyStart",
                                "type": "startEvent",
                                "begin": "_dummy_ts_",
                                "end": "_dummy_ts_"
                            },
                            "endEvent": null,
                            "duration": null
                        }
                    },
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid2",
                        "parentToken": null,
                        "properties": {
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
                            "createdAt": "_dummy_ts_",
                            "finishedAt": null
                        },
                        "pendingTimeouts": {},
                        "views": {
                            "startEvent": {
                                "name": "MyStart",
                                "type": "startEvent",
                                "begin": "_dummy_ts_",
                                "end": "_dummy_ts_"
                            },
                            "endEvent": null,
                            "duration": null
                        }
                    }
                ],
                "testMongoDBAfterPersistingProcess2");

            test.done();

        });


    });
};

exports.testMongoDBPersistentProcess2persistAtEnd = function(test) {
    var doneSaving = function(error) {
        test.ok(error === null, "testMongoDBPersistentProcess2persistAtEnd: no error saving.");
        test.done();
    };

    bpmnProcess2._implementation.doneSavingHandler = doneSaving;

    // we let the process run to the very end
    bpmnProcess2.taskDone("MyTask");
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

            // "_dummy_ts_" - "_dummy_ts_" = NaN, but NaN != NaN, so deepEqualFails
            test.ok(isNaN(results[1].views.duration), "testCreatePersistentHierarchicalProcess: saving: duration calculated" );
            results[1].views.duration = "_calculated_";

            test.deepEqual(results,
                [
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid1",
                        "parentToken": null,
                        "properties": {
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
                            "createdAt": "_dummy_ts_",
                            "finishedAt": null
                        },
                        "pendingTimeouts": {},
                        "views": {
                            "startEvent": {
                                "name": "MyStart",
                                "type": "startEvent",
                                "begin": "_dummy_ts_",
                                "end": "_dummy_ts_"
                            },
                            "endEvent": null,
                            "duration": null
                        }
                    },
                    {
                        "_id": "_dummy_id_",
                        "processName": "TaskExampleProcess",
                        "processId": "myid2",
                        "parentToken": null,
                        "properties": {
                            "myFirstProperty": {}
                        },
                        "state": {
                            "tokens": []
                        },
                        "history": {
                            "historyEntries": [
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
                                    "end": "_dummy_ts_"
                                },
                                {
                                    "name": "MyEnd",
                                    "type": "endEvent",
                                    "begin": "_dummy_ts_",
                                    "end": "_dummy_ts_"
                                }
                            ],
                            "createdAt": "_dummy_ts_",
                            "finishedAt": "_dummy_ts_"
                        },
                        "pendingTimeouts": {},
                        "views": {
                            "startEvent": {
                                "name": "MyStart",
                                "type": "startEvent",
                                "begin": "_dummy_ts_",
                                "end": "_dummy_ts_"
                            },
                            "endEvent": {
                                "name": "MyEnd",
                                "type": "endEvent",
                                "begin": "_dummy_ts_",
                                "end": "_dummy_ts_"
                            },
                            "duration": "_calculated_"
                        }
                    }
                ],
                "testMongoDBAfterEndOfProcess2");

            test.done();

        });
    });
};

exports.testMongoDBLoadProcess1 = function(test) {
    // clear cache otherwise we wouldn't load process one from the db
    bpmn.clearCache();

    var doneLoading = function(error, loadedData) {
        test.ok(error === null, "testMongoDBLoadProcess1: no error loading.");

        test.ok(loadedData._id !== undefined, "testMongoDBLoadProcess1: _id 1 exists");
        loadedData._id = "_dummy_id_";

        test.deepEqual(loadedData,
            {
                "_id": "_dummy_id_",
                "processName": "TaskExampleProcess",
                "processId": "myid1",
                "parentToken": null,
                "properties": {
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
                    "createdAt": "_dummy_ts_",
                    "finishedAt": null
                },
                "pendingTimeouts": {},
                "views": {
                    "startEvent": {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    "endEvent": null,
                    "duration": null
                }
            },
            "testMongoDBAfterPersistingProcess2");

        test.done();
    };

    bpmnProcess1 = bpmn.createProcess("myid1", bpmnFileName, {
        uri: persistencyUri,
        doneLoading: doneLoading,
        logger: logger
    });
};

exports.testMongoDBFlatProcessPersistenceExecutionTrace = function(test) {
    test.deepEqual(executionTrace,
        [
            "Trying to get connection for URI: mongodb://127.0.0.1:27017/ut_flatprocess ...",
            "Got connection 'ut_flatprocess' URI: mongodb://127.0.0.1:27017/ut_flatprocess",
            "Start finding 'TaskExampleProcess' ('myid1').",
            "Didn't find 'TaskExampleProcess' ('myid1').",
            "\nUsing existing connection 'ut_flatprocess'",
            "Start persisting 'TaskExampleProcess'",
            "Persisted 'TaskExampleProcess' ('myid1').",
            "\nUsing existing connection 'ut_flatprocess'",
            "Start finding 'TaskExampleProcess' ('myid2').",
            "Didn't find 'TaskExampleProcess' ('myid2').",
            "\nUsing existing connection 'ut_flatprocess'",
            "Start persisting 'TaskExampleProcess'",
            "Persisted 'TaskExampleProcess' ('myid2').",
            "\nUsing existing connection 'ut_flatprocess'",
            "Start persisting 'TaskExampleProcess'",
            "Persisted 'TaskExampleProcess' ('myid2').",
            "Trying to get connection for URI: mongodb://127.0.0.1:27017/ut_flatprocess ...",
            "Got connection 'ut_flatprocess' URI: mongodb://127.0.0.1:27017/ut_flatprocess",
            "Start finding 'TaskExampleProcess' ('myid1').",
            "Found 'TaskExampleProcess' ('myid1')."
        ],
        "testMongoDBFlatProcessPersistenceExecutionTrace"
    );
    test.done();
};

exports.closeConnections = function(test) {

    bpmnProcess2.closeConnection(function() {
        bpmnProcess1.closeConnection(function() {
           test.done();
        });
    });
};
