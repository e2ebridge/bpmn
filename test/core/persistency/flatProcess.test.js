/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

var pathModule = require('path');
var fileUtilsModule = require('../../../lib/utils/file.js');
var publicModule = require('../../../lib/public.js');
var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

require("../../../lib/history.js").setDummyTimestampFunction();

exports.testCreatePersistentFlatProcess = function(test) {
    var bpmnProcess;

    var persistencyUri = pathModule.join(__dirname, '../../resources/persistency/testPersistentProcess');
    fileUtilsModule.cleanDirectorySync(persistencyUri);

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
                "data": {
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
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "MyTask",
                            "begin": "_dummy_ts_",
                            "end": null
                        }
                    ],
                    "createdAt": "_dummy_ts_"
                },
                "pendingTimeouts": {},
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
                "data": {
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
                            "begin": "_dummy_ts_",
                            "end": "_dummy_ts_"
                        },
                        {
                            "name": "MyTask",
                            "begin": "_dummy_ts_",
                            "end": null
                        }
                    ],
                    "createdAt": "_dummy_ts_"
                },
                "pendingTimeouts": {},
                "_saved": "_dummy_ts_",
                "_updated": "_dummy_ts_",
                "_id": 1
            },
            "testCreatePersistentFlatProcess: loadedData."
        );

        test.done();
    };

    var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    publicModule.clearCache();
    var persistencyOptions = {
        uri: persistencyUri,
        doneSaving: savedState,
        doneLoading: loadedState
    };

    bpmnProcess = publicModule.createProcess("myid", fileName, persistencyOptions);

    // we let the process run to the first save state
    bpmnProcess.triggerEvent("MyStart");
};
