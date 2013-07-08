/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');

exports.testParseDebuggerInterface = function(test) {

    var bpmnProcessDefinitions = bpmnParser.parse("test/resources/bpmn/debuggerInterface.bpmn");
    var debuggerInterface = bpmnProcessDefinitions[0].debuggerInterface;

    test.equal(debuggerInterface.fileName, "test/resources/bpmn/debuggerInterface.bpmn", "testParseDebuggerInterface: fileName");

    test.deepEqual(debuggerInterface.url,
        {
            "protocol": "http:",
            "slashes": true,
            "auth": null,
            "host": "localhost:7261",
            "port": "7261",
            "hostname": "localhost",
            "hash": null,
            "search": null,
            "query": null,
            "pathname": "/grapheditor/debugger/position",
            "path": "/grapheditor/debugger/position",
            "href": "http://localhost:7261/grapheditor/debugger/position"
        },
        "testParseDebuggerInterface: url");
    test.done();
};
