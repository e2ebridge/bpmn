/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

// See https://github.com/mongodb/node-mongodb-native and
// http://mongodb.github.io/node-mongodb-native/api-articles/nodekoarticle1.html
"use strict";

var mongodb = require('mongodb');

exports.cleanUp = function(test) {
    mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
        db.dropDatabase(function(err) {
            db.close();
            test.done();
        });
    });
};

exports.testMongoDBInsert = function(test) {

    mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
       if(err) {
            test.ok(false, "testMongoDBInsert: cannot connect");
            test.done();
            return;
        }

        var collection = db.collection('collection1');
        collection.insert({a:2}, function(err, docs) {
            collection.find().toArray(function(err, results) {
                db.close();
                test.equal(1, results.length, "testMongoDBInsert: collection.find");
                test.ok(results[0].a === 2, "testMongoDBInsert: collection.results.a");
                test.done();
            });
        });
    });
};


exports.testMongoDBInsert2 = function(test) {

    var client = new mongodb.Db('test', new mongodb.Server("127.0.0.1", 27017, {}), {w:1}),

        testInsert = function (err, collection) {
            collection.insert({a:2}, function(err, docs) {

               // Locate all the entries using find
                collection.find().toArray(function(err, results) {
                    test.equal(1, results.length, "testMongoDBInsert2: collection.find");
                    test.ok(results[0].a === 2, "testMongoDBInsert2: collection.results.a");

                    // Let's close the db
                    client.close();
                    test.done();
                });
            });
        };

    client.open(function(err, p_client) {
        client.collection('collection2', testInsert);
    });
};

