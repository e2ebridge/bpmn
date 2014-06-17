/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var error = require('../../../lib/parsing/errors.js');
var fs = require('fs');

exports.testCallActivityNoFilePath = function(test) {

    var errorQueue = error.createBPMNParseErrorQueue();
    var bpmnFilePath = "test/resources/bpmn/callActivityNoFilePath.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    var bpmnDefinitions = bpmnParser.parse(bpmnXML, errorQueue);

    var bpmnDefinition = bpmnDefinitions[0];
    bpmnDefinition.validate(errorQueue);

    test.deepEqual(errorQueue.bpmnParseErrors,
        [
            {
                "code": "CA1",
                "description": "The callActivity 'call activity' must reference another process by its file name.",
                "bpmnId": "93",
                "bpmnName": "call activity",
                "bpmnType": "callActivity"
            }
        ],
        "testCallActivityNoFilePath");
    test.done();
};