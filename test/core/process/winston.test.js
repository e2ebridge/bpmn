/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var fileUtilsModule =  require('../../../lib/utils/file.js');
var publicModule = require('../../../lib/public.js');
var logLevels = require('../../../lib/logger.js').logLevels;
var winston = require('winston');

exports.testDefaultFileLogger = function(test) {
    var defaultLogFileName = "process.log";
    var defaultLogFilePath = ".";

    fileUtilsModule.removeFileSync(defaultLogFilePath, defaultLogFileName);
    publicModule.clearCache();

    var bpmnFileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    var bpmnProcess = publicModule.createProcess("myid", bpmnFileName);
    bpmnProcess.setLogLevel(logLevels.debug);
    bpmnProcess.removeLogTransport(winston.transports.Console); // keeping the output clean
    bpmnProcess.triggerEvent("MyStart");

    afterLogfileCreation(bpmnProcess, function() {
        var loggedLines = fileUtilsModule.readLines(pathModule.join(defaultLogFilePath, defaultLogFileName));
        var linesWOTimestamps = loggedLines.map(function(line) {
            return line.replace(/timestamp.+[^}]/, "\"timestamp\":TIMESTAMP");
        });
        test.deepEqual(linesWOTimestamps,
            [
                "{\"id\":\"unknown\",\"description\":\"DebuggerInterface: Sending '{\\\"filename\\\":\\\"dummyFileName\\\",\\\"position\\\":{\\\"bpmnId\\\":\\\"_123\\\"}}' to 'http://localhost:57261/grapheditor/debugger/position'\",\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Trigger startEvent 'MyStart'\",\"level\":\"trace\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Token was put on 'MyStart'\",\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Token arrived at startEvent 'MyStart'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Token was put on 'MyTask'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                "{\"process\":\"TaskExampleProcess\",\"id\":\"myid\",\"description\":\"Token arrived at task 'MyTask'\",\"data\":{},\"level\":\"debug\",\"message\":\"\",\"\"timestamp\":TIMESTAMP}",
                ""
            ],
            "testDefaultFileLogger");

        test.done();
    });
 };

exports.testNewWinstonTransport = function(test) {
    var logFile = "./logs/process.log";
    var baseDir = pathModule.dirname(logFile);

    // we have to make sure, that the directory exists. It would be inefficient if the logger would test for the
    // directory all the time
    fileUtilsModule.writeDirSync(baseDir);
    fileUtilsModule.cleanDirectorySync(baseDir);
    publicModule.clearCache();

    var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    var bpmnProcess = publicModule.createProcess("myid", fileName);
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
        var loggedLines = fileUtilsModule.readLines(logFile);
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

};

exports.testRemoveFileLogger = function(test) {
    publicModule.clearCache();

    var bpmnFileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    var bpmnProcess = publicModule.createProcess("myid", bpmnFileName);

    var winstonLogger = bpmnProcess._implementation.logger.winstonLogger;

    var fileTransportBefore = winstonLogger.transports["file"];
    test.ok(fileTransportBefore !== undefined, "testRemoveFileLogger: before");

    bpmnProcess.removeLogTransport(winston.transports.File);

    var fileTransportAfter = winstonLogger.transports["file"];
    test.ok(fileTransportAfter === undefined, "testRemoveFileLogger: after");

    test.done();
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