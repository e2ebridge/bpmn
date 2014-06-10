/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var bpmn = require('../../../lib/public.js');
var log = require('../../../lib/logger.js');

var logLevels = log.logLevels;
var Logger = log.Logger;

exports.testSetTextualLogLevel = function(test) {
    var logger = new Logger(null, {logLevel: "debug"});
    test.equal(logger.logLevel, 4, "testSetTextualLogLevel");
    test.done();
};

exports.testLogger = function(test) {
    var fileName;
    var logMessages = [];
    var logAppender = function(logMessage) {
        logMessages.push(logMessage);
    };

    bpmn.clearCache();

    fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    bpmn.createProcess("myid", fileName, function(err, bpmnProcess){
        bpmnProcess.setLogLevel(logLevels.debug);
        bpmnProcess.setLogAppender(logAppender);
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {
            test.deepEqual(logMessages,
                [
                    "[trace][TaskExampleProcess][myid][Trigger startEvent 'MyStart']",
                    "[debug][TaskExampleProcess][myid][Token was put on 'MyStart']",
                    "[debug][TaskExampleProcess][myid][Token arrived at startEvent 'MyStart'][{}]",
                    "[debug][TaskExampleProcess][myid][Token was put on 'MyTask'][{}]",
                    "[debug][TaskExampleProcess][myid][Token arrived at task 'MyTask'][{}]"
                ],
                "testLogger"
            );

            test.done();
        });
    });

};

exports.testLoggerStringLevel = function(test) {
    var fileName;
    var logMessages = [];
    var logAppender = function(logMessage) {
        logMessages.push(logMessage);
    };

    bpmn.clearCache();

    fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    bpmn.createProcess("myid", fileName, function(err, bpmnProcess){
        bpmnProcess.setLogLevel("debug");
        bpmnProcess.setLogAppender(logAppender);
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {
            test.deepEqual(logMessages,
                [
                    "[trace][TaskExampleProcess][myid][Trigger startEvent 'MyStart']",
                    "[debug][TaskExampleProcess][myid][Token was put on 'MyStart']",
                    "[debug][TaskExampleProcess][myid][Token arrived at startEvent 'MyStart'][{}]",
                    "[debug][TaskExampleProcess][myid][Token was put on 'MyTask'][{}]",
                    "[debug][TaskExampleProcess][myid][Token arrived at task 'MyTask'][{}]"
                ],
                "testLoggerStringLevel"
            );

            test.done();
        });
    });

};

