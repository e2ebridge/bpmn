/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var fileUtils = require('../../../lib/utils/file.js');

var Manager = require('../../../lib/manager').ProcessManager;

require("../../../lib/history.js").setDummyTimestampFunction();

exports.testCreatePersistentFlatProcess = function(test) {
    var bpmnProcess;

    var persistencyUri = path.join(__dirname, '../../resources/persistency/testPersistentProcess');
    fileUtils.cleanDirectorySync(persistencyUri);

    var savedState = function(error, savedData) {
        test.ok(error === null, "testCreatePersistentFlatProcess: no error saving.");

        var state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask",
                    "owningProcessId": "myid"
                }
            ],
            "testCreatePersistentFlatProcess: reached first wait state."
        );

        test.ok(savedData._saved !== undefined, "testCreatePersistentFlatProcess: saving: _saved exists");
        savedData._saved = "_dummy_ts_";

        test.ok(savedData._updated !== undefined, "testCreatePersistentFlatProcess: saving: _updated exists");
        savedData._updated = "_dummy_ts_";

        test.deepEqual(savedData,
            {
                "processName": "TaskExampleProcess",
                "processId": "myid",
                "parentToken": null,
                "properties": {
                    "myFirstProperty": {}
                },
                "state": {
                    "tokens": [
                        {
                            "position": "MyTask",
                            "owningProcessId": "myid"
                        }
                    ]
                },
                "history": {
                    "historyEntries": [
                        {
                            "name": "MyStart",
                            "type": "startEvent",
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "MyTask",
                            "type": "task",
                            "begin": "_dummy_ts_",
                            "end": null
                        }
                    ],
                    "createdAt": "_dummy_ts_",
                    "finishedAt": null
                },
                "pendingTimeouts": {},
                "views": {
                    "startEvent": {
                        "name": "MyStart",
                        "type": "startEvent",
                        "begin": "_dummy_ts_",
                        "end": "_dummy_ts_"
                    },
                    "endEvent": null,
                    "duration": null
                },
                "_saved": "_dummy_ts_",
                "_updated": "_dummy_ts_",
                "_id": 1
            },
            "testCreatePersistentFlatProcess: savedData."
        );

        test.done();
    };


    var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

    var persistencyOptions = {
        uri: persistencyUri,
        doneSaving: savedState
    };

    var manager = new Manager({
        bpmnFilePath: fileName,
        persistencyOptions: persistencyOptions
    });


    manager.createProcess("myid", function(err, process){
        bpmnProcess = process;

        // we let the process run to the first save state
        bpmnProcess.triggerEvent("MyStart");

    });
};

exports.testLoadPersistentFlatProcess = function(test){

    var persistencyUri = path.join(__dirname, '../../resources/persistency/testPersistentProcess');

    var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

    var persistencyOptions = {
        uri: persistencyUri
    };

    var manager = new Manager({
        bpmnFilePath: fileName,
        persistencyOptions: persistencyOptions
    });


    manager.get("myid", function(err, bpmnProcess){

        test.deepEqual(bpmnProcess.getState(), {
            tokens: [
                {
                    owningProcessId: 'myid',
                    position: 'MyTask'
                }
            ]
        }, "testLoadPersistentFlatProcess: state");

        test.deepEqual(bpmnProcess.getHistory(), {
            "historyEntries": [
                {
                    "name": "MyStart",
                    "type": "startEvent",
                    "begin": "_dummy_ts_",
                    "end": "_dummy_ts_"
                },
                {
                    "name": "MyTask",
                    "type": "task",
                    "begin": "_dummy_ts_",
                    "end": null
                }
            ],
            "createdAt": "_dummy_ts_",
            "finishedAt": null
        }, "testLoadPersistentFlatProcess: history");

        test.done();

    });
};
