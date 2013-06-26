/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var Persistency = require('../../../lib/persistency/persistency.js').Persistency;
var fileUtils = require('../../../lib/utils/file.js');
var persistencyPath = './test/resources/persistency/testPersistency';

exports.testFilePersistencyInsert = function(test) {
    fileUtils.cleanDirectorySync(persistencyPath);

    var persistency = new Persistency({path: persistencyPath});

    var persistentData = {
        processId: "mypid",
        data: {myattr: "x"},
        state: ["a", "b"],
        history: ["a", "b", "c", "d"]
    };

    var done = function(error, persistedData) {

        test.ok(persistedData._saved !== undefined, "testFilePersistencyInsert: _saved exists");
        persistedData._saved = "FIXEDTIMESTAMP4TESTING";

        test.ok(persistedData._updated !== undefined, "testFilePersistencyInsert: _updated exists");
        persistedData._updated = "FIXEDTIMESTAMP4TESTING";

        test.deepEqual(
            persistedData,
            {
                "processId": "mypid",
                "data": {
                    "myattr": "x"
                },
                "state": ["a", "b"],
                "history": ["a", "b", "c", "d"],
                "_id": 1,
                "_saved": "FIXEDTIMESTAMP4TESTING",
                "_updated": "FIXEDTIMESTAMP4TESTING"
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
    var persistency = new Persistency({path: persistencyPath});

    var persistentData = {
        processId: "mypid",
        data: {myattr: "CHANGED"},
        state: ["a", "CHANGED"],
        history: ["a", "b", "c", "d"]
    };

    var done = function(error, persistedData) {

        test.ok(persistedData._saved !== undefined, "testFilePersistencyUpdate: _saved exists");
        persistedData._saved = "FIXEDTIMESTAMP4TESTING";

        test.ok(persistedData._updated !== undefined, "testFilePersistencyUpdate: _updated exists");
        persistedData._updated = "FIXEDTIMESTAMP4TESTING";

        test.deepEqual(
            persistedData,
            {
                "processId": "mypid",
                "data": {
                    "myattr": "CHANGED"
                },
                "state": ["a", "CHANGED"],
                "history": ["a", "b", "c", "d"],
                "_id": 1,
                "_saved": "FIXEDTIMESTAMP4TESTING",
                "_updated": "FIXEDTIMESTAMP4TESTING"
            },
            "testFilePersistencyUpdate"
        );
        test.done();
    };

    process.nextTick(function() {
        persistency.persist(persistentData, done);
    });

};