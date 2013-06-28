/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

// See https://github.com/mongodb/node-mongodb-native and
// http://mongodb.github.io/node-mongodb-native/api-articles/nodekoarticle1.html
"use strict";

var mongodb = require('mongodb');
var MongoDBPersistency = require('../../lib/persistency/mongodb.js').Persistency;

var dbUri = 'mongodb://127.0.0.1:27017/ut_connection';
var persistency = new MongoDBPersistency(dbUri);

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

exports.testMongoDBPersistencyOK = function(test) {

    var data = {
        processId: "myId",
        processName: "testprocess",
        data: {
            x: "test data"
        }
    };

    var originalConnect = persistency._connect;
    persistency._connect = function(persistentData, done) {
        originalConnect.call(this, persistentData, done);
    };

    persistency.persist(data, function(error, document) {
        test.ok(error === undefined || error === null, "testMongoDBPersistencyOK: no error");

        test.ok(document._id !== undefined, "testMongoDBPersistencyOK: _id 1 exists");
        document._id = "_dummy_id_";

        test.deepEqual(document,
            {
                "_id": "_dummy_id_",
                "processId": "myId",
                "processName": "testprocess",
                "data": {
                    "x": "test data"
                }
            },
            "testMongoDBPersistencyOK: data");
        test.done();
    });
};


exports.testMongoDBClose = function(test) {
    persistency.close(function() {
        test.done();
    });
};
