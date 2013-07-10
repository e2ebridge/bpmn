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

var dbUri = 'mongodb://127.0.0.1:27017/ut_connection';
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

exports.testMongoDBConnectionOK = function(test) {

    var data = {
        processId: "myId",
        processName: "testprocess",
        properties: {
            x: "test data"
        }
    };

    persistency.persist(data, function(error, document) {
        test.ok(error === undefined || error === null, "testMongoDBConnectionOK: no error");

        test.ok(document._id !== undefined, "testMongoDBConnectionOK: _id 1 exists");
        document._id = "_dummy_id_";

        test.deepEqual(document,
            {
                "_id": "_dummy_id_",
                "processId": "myId",
                "processName": "testprocess",
                "properties": {
                    "x": "test data"
                }
            },
            "testMongoDBConnectionOK: data");
        test.done();
    });
};

exports.testMongoDBConnectionOKExecutionTrace = function(test) {
    test.deepEqual(executionTrace,
        [
            "Trying to get connection for URI: mongodb://127.0.0.1:27017/ut_connection ...",
            "Got connection 'ut_connection' URI: mongodb://127.0.0.1:27017/ut_connection",
            "Start persisting 'testprocess'",
            "Persisted 'testprocess' ('myId')."
        ],
        "testMongoDBConnectionOKExecutionTrace"
    );
    test.done();
};

exports.testMongoDBClose = function(test) {
    persistency.close(function() {
        test.done();
    });
};
