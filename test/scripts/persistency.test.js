/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var Persistency = require('../../lib/persistency.js').Persistency;
var persistencyPath = './test/resources/persistency/testPersistency';

exports.testFilePersistencyInsert = function(test) {
    var persistency = new Persistency({path: persistencyPath});
    persistency.cleanAllSync();

    var processEngine = {
        processInstanceId: "mypid",
        data: {myattr: "x"},
        state: ["a", "b"],
        processDefinition: {name: "myProcess", tasks: []},
        persistency: persistency
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
                "_id": 1
            },
            "testFilePersistencyInsert"
        );
        test.done();
    };


    process.nextTick(function() {
        persistency.persist(processEngine, done);
    });

};

exports.testFilePersistencyUpdate = function(test) {
    var persistency = new Persistency({path: persistencyPath});

    var processEngine = {
        processInstanceId: "mypid",
        data: {myattr: "CHANGED"},
        state: ["a", "CHANGED"],
        processDefinition: {name: "myProcess", tasks: []},
        persistency: persistency
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
                "_id": 1
            },
            "testFilePersistencyUpdate"
        );
        test.done();
    };

    process.nextTick(function() {
        persistency.persist(processEngine, done);
    });

};