/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var mongodb = require('mongodb');

exports.resetMongoDb = function(test) {
    mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/ut_mongodb', function(err, db) {
        db.dropDatabase(function(error) {
            test.ok(error === null || error === undefined, "resetMongoDb: nok");
            db.close();
            test.done();
        });
    });
};

exports.testMongoDBInsert = function(test) {

    // See https://github.com/mongodb/node-mongodb-native and
    // http://mongodb.github.io/node-mongodb-native/api-articles/nodekoarticle1.html
    mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/ut_mongodb', function(err, db) {
       if(err) {
            test.ok(false, "testMongoDBInsert: cannot connect");
            test.done();
            return;
        }

        var collection = db.collection('collection1');
        collection.insert({a:2}, function(error) {
            test.ok(error === null || error === undefined, "testMongoDBInsert: nok");
            collection.find().toArray(function(err, results) {
                db.close();
                test.equal(1, results.length, "testMongoDBInsert: collection.find");
                test.ok(results[0].a === 2, "testMongoDBInsert: collection.results.a");
                test.done();
            });
        });
    });
};

