/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnParser = require('../../../lib/parsing/parser.js');
var fs = require('fs');

exports.testParseDebuggerInterface = function(test) {

    var bpmnFilePath = "test/resources/bpmn/debuggerInterface.bpmn";
    var bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
    var bpmnProcessDefinitions = bpmnParser.parse(bpmnXML, null, null, bpmnFilePath);
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
