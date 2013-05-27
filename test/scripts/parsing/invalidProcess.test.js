/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnDefinitionsModule = require('../../../lib/parsing/definitions.js');
var pathModule = require('path');
var errorsModule = require('../../../lib/errors.js');

exports.testInvalidProcessErrors = function(test) {

    var fileName = pathModule.join(__dirname, "../../resources/bpmn/invalidProcess.bpmn");
    bpmnDefinitionsModule.clearCache();

    /** {ErrorQueue} */
    var errorQueue;
    try {
        bpmnDefinitionsModule.getBPMNProcessDefinitions(fileName);
    } catch (e) {
        errorQueue = e;
    }

    test.deepEqual(errorQueue.bpmnErrors,
        [
            {
                "code": "FO3",
                "description": "The startEvent 'MyStart' must have exactly one outgoing sequence flow."
            },
            {
                "code": "FO5",
                "description": "The task 'MyTask' must have at least one incoming sequence flow."
            },
            {
                "code": "FO2",
                "description": "The task 'MyTask' must have at least one outgoing sequence flow."
            }
        ],
        "testInvalidProcessErrors");
    test.done();
};