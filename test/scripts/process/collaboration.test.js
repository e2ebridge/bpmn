/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var publicModule = require('../../../lib/public.js');

exports.testSendingWrongEventInCollaboration = function(test) {
    publicModule.clearCache();

    var fileName = pathModule.join(__dirname, "../../resources/projects/collaboration/collaboration.bpmn");
    var processDescriptors = [
        {name: "My First Process", id: "myFirstProcessId_1"},
        {name: "My Second Process", id: "mySecondProcessId_1"}
    ];
    var collaboratingProcesses = publicModule.createCollaboratingProcesses(processDescriptors, fileName);

    var secondProcess = collaboratingProcesses[0];
    try {
        secondProcess.sendEvent("Wrong Event!");
    } catch (e) {
        var message = e.message;
        test.equal(message, "The process 'My First Process' does not know the event 'Wrong Event!'", "testSendingWrongEventInCollaboration");
        test.done();
    }
};

exports.testCreateVolatileCollaborationOfBPMNProcesses = function(test) {
    publicModule.clearCache();

    var fileName = pathModule.join(__dirname, "../../resources/projects/collaboration/collaboration.bpmn");
    var processDescriptors = [
        {name: "My First Process", id: "myFirstProcessId_1"},
        {name: "My Second Process", id: "mySecondProcessId_1"}
    ];
    var collaboratingProcesses = publicModule.createCollaboratingProcesses(processDescriptors, fileName);

    var firstProcess = collaboratingProcesses[0];
    var secondProcess = collaboratingProcesses[1];
    secondProcess.sendEvent("Start Event 2");

    process.nextTick(function() {
        var firstHistory = firstProcess.getHistory();
        test.deepEqual(firstHistory,
            {
                "historyEntries": [
                    {
                        "name": "Start Event 1"
                    },
                    {
                        "name": "Task 1"
                    },
                    {
                        "name": "End Event 1"
                    }
                ]
            },
            "testCreateVolatileCollaborationOfBPMNProcesses: history of process 1"
        );
        var secondHistory = secondProcess.getHistory();
        test.deepEqual(secondHistory,
            {
                "historyEntries": [
                    {
                        "name": "Start Event 2"
                    },
                    {
                        "name": "Task 2"
                    },
                    {
                        "name": "Catch End Event 1"
                    },
                    {
                        "name": "End Event 2"
                    }
                ]
            },
            "testCreateVolatileCollaborationOfBPMNProcesses: history of process 2"
        );
        test.done();
    });
};
