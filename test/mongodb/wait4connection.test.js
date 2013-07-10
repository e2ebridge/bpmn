/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var mongodb = require('mongodb');
var MongoDBPersistency = require('../../lib/persistency/mongodb.js').Persistency;

var executionTrace = [];
var logger = {
    trace: function(message) {
        executionTrace.push(message);
    }
};

var dbUri = 'mongodb://127.0.0.1:27017/ut_wait4connection';
var persistency = new MongoDBPersistency(dbUri, {logger: logger});

exports.resetMongoDb = function(test) {
    mongodb.MongoClient.connect(dbUri, function(err, db) {
        db.dropDatabase(function(error) {
            if (error) {
               test.ok(false, "resetMongoDb: nok");
            }
            db.close();
            test.done();
        });
    });
};

exports.testMongoDBWait4Connection = function(test) {

    var originalConnect = persistency._connect;
    persistency._connect = function(persistentData, done) {
        var self = this;
        setTimeout(function() {
            originalConnect.call(self, persistentData, done);
        }, 200);
    };

    var counter = 0;
    var finishTest = function() {
        counter = counter + 1;
        if (counter === 2) {
            test.done();
        }
    };

    var data1 = {
        processId: "myId001",
        processName: "testwait4connection",
        properties: {
            x: "test data"
        }
    };

    persistency.persist(data1, function(error, document) {
        test.ok(error === undefined || error === null, "testMongoDBWait4Connection: no error");

        test.ok(document._id !== undefined, "testMongoDBWait4Connection: _id 1 exists");
        document._id = "_dummy_id_";

        test.deepEqual(document,
            {
                "_id": "_dummy_id_",
                "processId": "myId001",
                "processName": "testwait4connection",
                "properties": {
                    "x": "test data"
                }
            },
            "testMongoDBPersistencyOK: data");
        finishTest();
    });

    var data2 = {
        processId: "myId002",
        processName: "testwait4connection",
        properties: {
            x: "test data"
        }
    };

    persistency.persist(data2, function(error, document) {
        test.ok(error === undefined || error === null, "testMongoDBWait4Connection: no error");

        test.ok(document._id !== undefined, "testMongoDBWait4Connection: _id 2 exists");
        document._id = "_dummy_id_";

        test.deepEqual(document,
            {
                "_id": "_dummy_id_",
                "processId": "myId002",
                "processName": "testwait4connection",
                "properties": {
                    "x": "test data"
                }
            },
            "testMongoDBPersistencyOK: data");
        finishTest();
    });
};

exports.testMongoDBConnectionExecutionTrace = function(test) {
    // we take only the trace lines that are written while connecting
    var connectionBuildUpTrace = executionTrace.splice(0, 4);
    test.deepEqual(connectionBuildUpTrace,
        [
            "Trying to get connection for URI: mongodb://127.0.0.1:27017/ut_wait4connection ...",
            "Waiting for connection. URI: mongodb://127.0.0.1:27017/ut_wait4connection",
            "Got connection 'ut_wait4connection' URI: mongodb://127.0.0.1:27017/ut_wait4connection",
            "Stopped waiting. Got connection 'ut_wait4connection'."
        ],
        "testMongoDBConnectionExecutionTrace"
    );
    test.done();
};

exports.testMongoDBClose = function(test) {
    persistency.close(function() {
        test.done();
    });
};
