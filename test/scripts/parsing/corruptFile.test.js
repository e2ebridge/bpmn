/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../lib/parsing/parser.js');
var errorsModule = require('../../../lib/errors.js');

exports.testParseCorruptFile = function(test) {

    var errorQueue = errorsModule.createErrorQueue();
    bpmnParserModule.parse("test/resources/bpmn/corruptFile.bpmn", errorQueue);

    test.deepEqual(errorQueue,
        {
            "bpmnErrors": [
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