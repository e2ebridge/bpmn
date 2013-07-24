/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var MongoDBPersistency = require('../../lib/persistency/mongodb.js').Persistency;

var executionTrace = [];
var logger = {
    trace: function(message) {
        //console.log(message);
        executionTrace.push(message);
    }
};

var dbUri = 'mongodb://gugus:27017/ut_connection';
var persistency = new MongoDBPersistency(dbUri, {
    "logger": logger
});

exports.testMongoDBConnectionNOK = function(test) {

    persistency.persist({}, function(error) {
        test.ok(error !== undefined || error !== null, "testMongoDBConnectionNOK: error occurred");
        test.done();
    });
};

exports.testMongoDBConnectionNOKExecutionTrace = function(test) {
    test.deepEqual(executionTrace,
        [
            "Trying to get connection for URI: mongodb://gugus:27017/ut_connection ...",
            "ERROR: Could not get connection. URI: mongodb://gugus:27017/ut_connection Error: Error: failed to connect to [gugus:27017]"
        ],
        "testMongoDBConnectionNOKExecutionTrace"
    );
    test.done();
};

exports.testMongoDBClose = function(test) {
    // there is nothing to close, but the call has to work anyway
    persistency.close(function() {
        test.done();
    });
};
