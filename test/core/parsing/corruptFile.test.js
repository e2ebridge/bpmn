/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var fs = require('fs');

var bpmnParser = require('../../../lib/parsing/parser.js');
var error = require('../../../lib/parsing/errors.js');

exports.testParseCorruptXML = function(test) {

    var errorQueue = error.createBPMNParseErrorQueue();
    var bpmnXML = fs.readFileSync("test/resources/bpmn/corruptFile.bpmn", "utf-8");

    bpmnParser.parse(bpmnXML, errorQueue);

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
            "fileName": undefined
        },
        "testParseCorruptFile");
    test.done();
};