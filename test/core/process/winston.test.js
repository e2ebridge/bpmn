/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var fileUtils =  require('../../../lib/utils/file.js');
var bpmn = require('../../../lib/public.js');
var winston = require('winston');

var logLevels = require('../../../lib/logger.js').logLevels;

exports.testDefaultFileLogger = function(test) {
    var processId = "testdefaultfileloggerprocessid";
    var defaultLogFileName = "process.log";
    var defaultLogFilePath = ".";

    fileUtils.removeFileSync(defaultLogFilePath, defaultLogFileName);

    var manager = new bpmn.ProcessManager();
    manager.addBpmnFilePath(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"));
    manager.createProcess(processId, function(err, bpmnProcess){
        bpmnProcess.setLogLevel(logLevels.debug);
        bpmnProcess.removeLogTransport(winston.transports.Console); // keeping the output clean
        bpmnProcess.triggerEvent("MyStart");

        afterLogfileCreation(bpmnProcess, function() {
            var loggedLines = fileUtils.readLines(path.join(defaultLogFilePath, defaultLogFileName));
            var taskExampleProcessLines = loggedLines.filter(function(line) {
                return (line.indexOf(processId) > -1);
            });
            var linesWOTimestamps = taskExampleProcessLines.map(function(line) {
                return line.replace(/timestamp.+[^}]/, "\"timestamp\":TIMESTAMP");
            });
            test.deepEqual(linesWOTimestamps,
                [
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"testdefaultfileloggerprocessid\",\"description\":\"Trigger startEvent 'MyStart'\",\"level\":\"trace\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"testdefaultfileloggerprocessid\",\"description\":\"Token was put on 'MyStart'\",\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"testdefaultfileloggerprocessid\",\"description\":\"Token arrived at startEvent 'MyStart'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"testdefaultfileloggerprocessid\",\"description\":\"Token was put on 'MyTask'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"testdefaultfileloggerprocessid\",\"description\":\"Token arrived at task 'MyTask'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}"
                ],
                "testDefaultFileLogger");

            test.done();
        });
        test.done();
    });

 };

exports.testNewWinstonTransport = function(test) {
    var logFile = "./logs/process.log";
    var baseDir = path.dirname(logFile);

    // we have to make sure, that the directory exists. It would be inefficient if the logger would test for the
    // directory all the time
    fileUtils.writeDirSync(baseDir);
    fileUtils.cleanDirectorySync(baseDir);
    bpmn.clearCache();

    var manager = new bpmn.ProcessManager();
    manager.addBpmnFilePath(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"));
    manager.createProcess("myid", function(err, bpmnProcess){
        bpmnProcess.setLogLevel(logLevels.debug);
        bpmnProcess.removeLogTransport(winston.transports.Console); // keeping the output clean
        bpmnProcess.addLogTransport(winston.transports.File,
            {
                level: 'verbose',
                filename: logFile,
                maxsize: 64 * 1024 * 1024,
                maxFiles: 100,
                timestamp: function() {
                    return "TIMESTAMP";
                }
            }
        );
        bpmnProcess.triggerEvent("MyStart");

        afterLogfileCreation(bpmnProcess, function() {
            var loggedLines = fileUtils.readLines(logFile);
            test.deepEqual(loggedLines,
                [
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Trigger startEvent 'MyStart'\",\"level\":\"trace\",\"message\":\"\",\"timestamp\":\"TIMESTAMP\"}",
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Token was put on 'MyStart'\",\"level\":\"debug\",\"message\":\"\",\"timestamp\":\"TIMESTAMP\"}",
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Token arrived at startEvent 'MyStart'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"timestamp\":\"TIMESTAMP\"}",
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Token was put on 'MyTask'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"timestamp\":\"TIMESTAMP\"}",
                    "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Token arrived at task 'MyTask'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"timestamp\":\"TIMESTAMP\"}",
                    ""
                ],
                "testNewWinstonTransport");
            test.done();
        });
    });


};

exports.testRemoveFileLogger = function(test) {
    bpmn.clearCache();

    var manager = new bpmn.ProcessManager();
    manager.addBpmnFilePath(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"));
    manager.createProcess("myid", function(err, bpmnProcess){
        var winstonLogger = bpmnProcess._implementation.logger.winstonLogger;

        var fileTransportBefore = winstonLogger.transports.file;
        test.ok(fileTransportBefore !== undefined, "testRemoveFileLogger: before");

        bpmnProcess.removeLogTransport(winston.transports.File);

        var fileTransportAfter = winstonLogger.transports.file;
        test.ok(fileTransportAfter === undefined, "testRemoveFileLogger: after");

        test.done();
    });
};

function afterLogfileCreation(bpmnProcess, callback) {
    var winstonLogger = bpmnProcess._implementation.logger.winstonLogger;
    var logfileHasBeenCreated = false;
    winstonLogger.on("logging", function() {
        if (!logfileHasBeenCreated) {
            logfileHasBeenCreated = true;
            callback();
        }
    });
}