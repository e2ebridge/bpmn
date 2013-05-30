/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var fileUtilsModule = require('../../../lib/utils/file.js');
var publicModule = require('../../../lib/public.js');
var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

exports.testCreatePersistentFlatProcess = function(test) {
    var bpmnProcess;

    var persistencyPath = pathModule.join(__dirname, '../../resources/persistency/testPersistentProcess');
    fileUtilsModule.cleanDirectorySync(persistencyPath);

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
        savedData._saved = "FIXEDTIMESTAMP4TESTING";

        test.ok(savedData._updated !== undefined, "testCreatePersistentFlatProcess: saving: _updated exists");
        savedData._updated = "FIXEDTIMESTAMP4TESTING";

        test.deepEqual(savedData,
            {
                "processName": "TaskExampleProcess",
                "processId": "myid",
                "parentToken": null,
                "data": {},
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
                            "name": "MyStart"
                        },
                        {
                            "name": "MyTask"
                        }
                    ]
                },
                "pendingTimeouts": {},
                "_id": 1,
                "_saved": "FIXEDTIMESTAMP4TESTING",
                "_updated": "FIXEDTIMESTAMP4TESTING"
            },
            "testCreatePersistentFlatProcess: saved data."
        );

        // this points to the process client interface and not to the process directly
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
        loadedData._saved = "FIXEDTIMESTAMP4TESTING";

        test.ok(loadedData._updated !== undefined, "testCreatePersistentFlatProcess: loading: _updated exists");
        loadedData._updated = "FIXEDTIMESTAMP4TESTING";

        test.deepEqual(loadedData,
            {
                "processName": "TaskExampleProcess",
                "processId": "myid",
                "parentToken": null,
                "data": {},
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
                            "name": "MyStart"
                        },
                        {
                            "name": "MyTask"
                        }
                    ]
                },
                "pendingTimeouts": {},
                "_id": 1,
                "_saved": "FIXEDTIMESTAMP4TESTING",
                "_updated": "FIXEDTIMESTAMP4TESTING"
            },
            "testCreatePersistentFlatProcess: loaded data."
        );

        test.done();
    };

    var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    publicModule.clearCache();
    var persistencyOptions = {
        persistencyPath: persistencyPath,
        doneSaving: savedState,
        doneLoading: loadedState
    };

    bpmnProcess = publicModule.createProcess("myid", fileName, persistencyOptions);

    // we let the process run to the first save state
    bpmnProcess.triggerEvent("MyStart");
};
