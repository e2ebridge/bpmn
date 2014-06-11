/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var fileUtils = require('../../../lib/utils/file.js');
var bpmn = require('../../../lib/public.js');

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

        // 'this' points to the process client interface and not to the process
        // thus, we access the process implementation directly
        this._implementation.loadPersistedData();
    };

    var loadedState = function(error, loadedData) {
        test.ok(error === undefined || error === null, "testCreatePersistentFlatProcess: no error loading.");

        var state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask",
                    "owningProcessId": "myid"
                }
            ],
            "testCreatePersistentFlatProcess: reached save state."
        );

        test.ok(loadedData._saved !== undefined, "testCreatePersistentFlatProcess: loading: _saved exists");
        loadedData._saved = "_dummy_ts_";

        test.ok(loadedData._updated !== undefined, "testCreatePersistentFlatProcess: loading: _updated exists");
        loadedData._updated = "_dummy_ts_";

        test.deepEqual(loadedData,
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
            "testCreatePersistentFlatProcess: loadedData."
        );

        test.done();
    };

    var manager = new bpmn.ProcessManager({
        persistencyOptions: {
            uri: persistencyUri,
            doneSaving: savedState,
            doneLoading: loadedState
        }
    });
    manager.addBpmnFilePath(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"));

    manager.createProcess("myid", function(err, process){
        bpmnProcess = process;

        // we let the process run to the first save state
        bpmnProcess.triggerEvent("MyStart");

    });
};
