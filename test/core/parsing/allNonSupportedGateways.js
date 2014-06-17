/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var error = require("../../../lib/parsing/errors.js");
var fs = require('fs');

exports.testParseBPMNAllNonSupportedGateways = function(test) {

    var errorQueue = error.createBPMNParseErrorQueue();
    var bpmnFilePath = "test/resources/bpmn/allNonSupportedGateways.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    bpmnParser.parse(bpmnXML, errorQueue);

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
