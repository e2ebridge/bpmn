/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnDefinitions = require('../../../lib/parsing/definitions.js');
var path = require('path');

exports.testInvalidProcessErrors = function(test) {

    var fileName = path.join(__dirname, "../../resources/bpmn/invalidProcess.bpmn");
    bpmnDefinitions.clearCache();

    /** {BPMNParseErrorQueue} */
    var errorQueue;
    try {
        bpmnDefinitions.getBPMNProcessDefinitions(fileName);
    } catch (e) {
        errorQueue = e;
    }

    test.deepEqual(errorQueue.bpmnParseErrors,
        [
            {
                "code": "FO3",
                "description": "The startEvent 'MyStart' must have exactly one outgoing sequence flow.",
                "bpmnId": "_2",
                "bpmnName": "MyStart",
                "bpmnType": "startEvent"
            },
            {
                "code": "FO5",
                "description": "The task 'MyTask' must have at least one incoming sequence flow.",
                "bpmnId": "_3",
                "bpmnName": "MyTask",
                "bpmnType": "task"
            },
            {
                "code": "FO2",
                "description": "The task 'MyTask' must have at least one outgoing sequence flow.",
                "bpmnId": "_3",
                "bpmnName": "MyTask",
                "bpmnType": "task"
            }
        ],
        "testInvalidProcessErrors");
    test.done();
};