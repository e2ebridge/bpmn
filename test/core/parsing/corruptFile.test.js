/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var error = require('../../../lib/parsing/errors.js');

exports.testParseCorruptFile = function(test) {

    var errorQueue = error.createBPMNParseErrorQueue();
    bpmnParser.parse("test/resources/bpmn/corruptFile.bpmn", errorQueue);

    test.deepEqual(errorQueue,
        {
            "bpmnParseErrors": [
                {
                    "code": "NOPARSE",
                    "description": "Unquoted attribute value\nLine: 6\nColumn: 30\nChar: 1",
                    "bpmnId": "Unknown",
                    "bpmnName": "",
                    "bpmnType": "Unknown"
                },
                {
                    "code": "NOPARSE",
                    "description": "Unquoted attribute value\nLine: 14\nColumn: 50\nChar: _",
                    "bpmnId": "Unknown",
                    "bpmnName": "",
                    "bpmnType": "Unknown"
                }
            ],
            "fileName": "test/resources/bpmn/corruptFile.bpmn"
        },
        "testParseCorruptFile");
    test.done();
};