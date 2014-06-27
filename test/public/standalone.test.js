/**
 * Copyright: E2E Technologies Ltd
 * Author: Cyril Schmitt <cschmitt@e2ebridge.com>
 */
"use strict";

var path = require('path');
var fs = require('fs');

var bpmn = require('../../lib/public');

exports.testCreateStandaloneBPMNProcessFromXMLandString = function(test) {

    var bpmnXML = fs.readFileSync(path.join(__dirname, "../resources/projects/simple/taskExampleProcess.bpmn"), "utf8");
    var handlerString = fs.readFileSync(path.join(__dirname, "../resources/projects/simple/taskExampleProcess.js"), "utf8");

    bpmn.createUnmanagedProcessFromXML(bpmnXML, handlerString, function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {
            var state = bpmnProcess.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": null
                    }
                ],
                "testCreateStandaloneBPMNProcessFromXMLandString: reached first wait state."
            );

            test.done();
        });
    });

};

exports.testCreateStandaloneBPMNProcessFromXMLandObject = function(test) {

    var bpmnXML = fs.readFileSync(path.join(__dirname, "../resources/projects/simple/taskExampleProcess.bpmn"), "utf8");
    var handler = require(path.join(__dirname, "../resources/projects/simple/taskExampleProcess.js"));

    bpmn.createUnmanagedProcessFromXML(bpmnXML, handler, function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {
            var state = bpmnProcess.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": null
                    }
                ],
                "testCreateStandaloneBPMNProcessFromXMLandObject: reached first wait state."
            );

            test.done();
        });
    });

};

exports.testCreateStandaloneBPMNProcessFromXMLUsingMultipleDefError = function(test) {

    var bpmnXML = fs.readFileSync(path.join(__dirname, "../resources/projects/collaboration/collaboration.bpmn"), "utf8");
    var handler = require(path.join(__dirname, "../resources/projects/simple/taskExampleProcess.js"));

    bpmn.createUnmanagedProcessFromXML(bpmnXML, handler, function(err){
        test.equal(err.message, "The BPMN XML contains more than one process definition. Use 'createCollaboratingProcesses' instead of 'createProcess'", "testCreateStandaloneBPMNProcessFromXMLUsingMultipleDefError: creation error." );
        test.done();
    });

};
