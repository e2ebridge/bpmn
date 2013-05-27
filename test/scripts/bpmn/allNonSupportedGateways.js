/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/bpmn/parser.js');
var errorQueueModule = require("../../../lib/errors.js");

exports.testParseBPMNAllNonSupportedGateways = function(test) {

    var errorQueue = errorQueueModule.createErrorQueue();
    bpmnParserModule.parse("test/resources/bpmn/allNonSupportedGateways.bpmn", errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Inclusive Gateway' is not supported yet."
            },
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Complex Gateway' is not supported yet."
            },
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Event Gateway' is not supported yet."
            },
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Event Gateway (Instantiate)' is not supported yet."
            },
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Parallel Event Gateway (Instantiate)' is not supported yet."
            }
        ],
        "testParseBPMNAllNonSupportedGateways");
    test.done();
};
