/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/parsing/parser.js');
var errorQueueModule = require("../../../lib/parsing/errors.js");

exports.testParseBPMNAllNonSupportedGateways = function(test) {

    var errorQueue = errorQueueModule.createBPMNParseErrorQueue();
    bpmnParserModule.parse("test/resources/bpmn/allNonSupportedGateways.bpmn", errorQueue);

    var errors = errorQueue.getErrors();
    test.deepEqual(errors,
        [
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Inclusive Gateway' is not supported yet.",
                "bpmnId": "_2",
                "bpmnName": "Inclusive Gateway",
                "bpmnType": "inclusiveGateway"
            },
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Complex Gateway' is not supported yet.",
                "bpmnId": "_3",
                "bpmnName": "Complex Gateway",
                "bpmnType": "complexGateway"
            },
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Event Gateway' is not supported yet.",
                "bpmnId": "_4",
                "bpmnName": "Event Gateway",
                "bpmnType": "eventBasedGateway"
            },
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Event Gateway (Instantiate)' is not supported yet.",
                "bpmnId": "_5",
                "bpmnName": "Event Gateway (Instantiate)",
                "bpmnType": "eventBasedGateway"
            },
            {
                "code": "UnsupportedGateway",
                "description": "The gateway 'Parallel Event Gateway (Instantiate)' is not supported yet.",
                "bpmnId": "_6",
                "bpmnName": "Parallel Event Gateway (Instantiate)",
                "bpmnType": "eventBasedGateway"
            }
        ],
        "testParseBPMNAllNonSupportedGateways");
    test.done();
};
