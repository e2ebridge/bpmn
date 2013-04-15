/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var Persistency = require('../../../lib/execution/persistency.js').Persistency;
var persistencyPath = './test/resources/persistency/testPersistency';

exports.testFilePersistencyInsert = function(test) {
    var persistency = new Persistency({path: persistencyPath});
    persistency.cleanAllSync();

    var persistentData = {
        processInstanceId: "mypid",
        data: {myattr: "x"},
        state: ["a", "b"],
        history: ["a", "b", "c", "d"]
    };

    var done = function(error, persistedData) {
        test.deepEqual(
            persistedData,
            {
                "processInstanceId": "mypid",
                "data": {
                    "myattr": "x"
                },
                "state": ["a", "b"],
                "history": ["a", "b", "c", "d"],
                "_id": 1
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
        processInstanceId: "mypid",
        data: {myattr: "CHANGED"},
        state: ["a", "CHANGED"],
        history: ["a", "b", "c", "d"]
    };

    var done = function(error, persistedData) {
        test.deepEqual(
            persistedData,
            {
                "processInstanceId": "mypid",
                "data": {
                    "myattr": "CHANGED"
                },
                "state": ["a", "CHANGED"],
                "history": ["a", "b", "c", "d"],
                "_id": 1
            },
            "testFilePersistencyUpdate"
        );
        test.done();
    };

    process.nextTick(function() {
        persistency.persist(persistentData, done);
    });

};