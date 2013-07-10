/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var Persistency = require('../../../lib/persistency/persistency.js').Persistency;
var fileUtils = require('../../../lib/utils/file.js');
var persistencyUri = './test/resources/persistency/testPersistency';

exports.testFilePersistencyInsert = function(test) {
    fileUtils.cleanDirectorySync(persistencyUri);

    var persistency = new Persistency({uri: persistencyUri});
    var persistentData = {
        processId: "mypid",
        properties: {myattr: "x"},
        state: ["a", "b"],
        history: ["a", "b", "c", "d"]
    };
    var done = function(error, persistedData) {

        test.ok(persistedData._saved !== undefined, "testFilePersistencyInsert: _saved exists");
        persistedData._saved = "_dummy_ts_";

        test.ok(persistedData._updated !== undefined, "testFilePersistencyInsert: _updated exists");
        persistedData._updated = "_dummy_ts_";

        test.deepEqual(
            persistedData,
            {
                "processId": "mypid",
                "properties": {
                    "myattr": "x"
                },
                "state": ["a", "b"],
                "history": ["a", "b", "c", "d"],
                "_id": 1,
                "_saved": "_dummy_ts_",
                "_updated": "_dummy_ts_"
            },
            "testFilePersistencyInsert"
        );
        test.done();
    };

    process.nextTick(function() {
        persistency.persist(persistentData, done);
    });

};

exports.testFilePersistencyUpdate = function(test) {
    var persistency = new Persistency({uri: persistencyUri});
    var persistentData = {
        processId: "mypid",
        properties: {myattr: "CHANGED"},
        state: ["a", "CHANGED"],
        history: ["a", "b", "c", "d"]
    };
    var done = function(error, persistedData) {

        test.ok(persistedData._saved !== undefined, "testFilePersistencyUpdate: _saved exists");
        persistedData._saved = "_dummy_ts_";

        test.ok(persistedData._updated !== undefined, "testFilePersistencyUpdate: _updated exists");
        persistedData._updated = "_dummy_ts_";

        test.deepEqual(
            persistedData,
            {
                "processId": "mypid",
                "properties": {
                    "myattr": "CHANGED"
                },
                "state": ["a", "CHANGED"],
                "history": ["a", "b", "c", "d"],
                "_id": 1,
                "_saved": "_dummy_ts_",
                "_updated": "_dummy_ts_"
            },
            "testFilePersistencyUpdate"
        );
        test.done();
    };

    process.nextTick(function() {
        persistency.persist(persistentData, done);
    });

};