/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnParserModule = require('../../../../lib/bpmn/parser.js');
var errorsModule = require('../../../../lib/errors.js');

exports.testParseCorruptFile = function(test) {

    var errorQueue = errorsModule.createErrorQueue();
    bpmnParserModule.parse("test/resources/bpmn/corruptFile.bpmn", errorQueue);

    test.deepEqual(errorQueue,
        {
            "buildErrors": [
                {
                    "code": "ParseBPMN",
                    "fileName": "test/resources/bpmn/corruptFile.bpmn",
                    "description": "Unquoted attribute value\nLine: 6\nColumn: 30\nChar: 1"
                },
                {
                    "code": "ParseBPMN",
                    "fileName": "test/resources/bpmn/corruptFile.bpmn",
                    "description": "Unquoted attribute value\nLine: 14\nColumn: 50\nChar: _"
                }
            ]
        },
        "testParseCorruptFile");
    test.done();
};