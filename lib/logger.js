/**
 * Copyright: E2E Technologies Ltd.
 */
"use strict";

var winston = require('winston');

/**
 * @enum {number}
 */
var logLevels = exports.logLevels = {
        silly: 0, // winston
        verbose: 1, // winston
        info: 2, // winston
        warn: 3, // winston
        debug: 4, // winston
        trace: 5,
        error: 6, // winston
        none: 7
};

var logLevelColors = {
    silly: 'yellow',
    verbose: 'blue',
    info: 'green',
    warn: 'orange',
    debug: 'black', // does not work in WebStorm
    trace: 'grey',
    error: 'red'
};

/**
 * @param {BPMNProcess=} process
 * @param {{logLevel: number}} options
 * @constructor
 */
var Logger = exports.Logger = function(process, options) {
    this.logLevel = logLevels.error;
    if (options) {
        this.logLevel = getLogLevelValue(options.logLevel || this.logLevel);
    }

    /** {function(string)} */
    this.logAppender = null; // used for example to test log messages

    this.winstonFileTransport = new (winston.transports.File)({
        //level: getLogLevelString(this.logLevel), //TODO: this should work, but it doesn't. Why?
        level: 'verbose',
        filename: './process.log',
        maxsize: 64 * 1024 * 1024,
        maxFiles: 100,
        timestamp: function() {
            return Date.now();
        }
    });
    this.winstonConsoleTransport = new (winston.transports.Console)({
        //level: getLogLevelString(this.logLevel), //TODO: this should work, but it doesn't. Why?
        level: 'verbose',
        colorize: true,
        json: false
    });
    this.winstonLogger = new (winston.Logger)({
        transports: [this.winstonFileTransport, this.winstonConsoleTransport],
        levels: logLevels,
        colors: logLevelColors
    });

    this.setProcess(process);
};

// All log levels are available as logger methods
Object.keys(logLevels).forEach(function(logLevelName) {
    Logger.prototype[logLevelName] = function(description, data) {
        this.log(logLevels[logLevelName], description, data);
    };
});

/**
 * @param {BPMNProcessClient|BPMNProcess} bpmnProcess
 */
Logger.prototype.setProcess = function(bpmnProcess) {
    if (bpmnProcess) {
        this.processDefinition = bpmnProcess.getProcessDefinition();
        this.processId = bpmnProcess.getProcessId();
        bpmnProcess.setLogger(this);
    } else {
        this.processDefinition = {};
        this.processId = "unknown";
    }
};

/**
 * @param {number | string} logLevel
 */
Logger.prototype.setLogLevel = function(logLevel) {
    var levelValue = getLogLevelValue(logLevel);
    var levelName = getLogLevelString(levelValue);

    this.logLevel = levelValue;
    this.winstonConsoleTransport.level = levelName;
    this.winstonFileTransport.level = levelName;
};

/**
 * Add winston log transport (semantic like winston add() [https://github.com/flatiron/winston])
 * @param WinstonTransport
 * @param options
 */
Logger.prototype.addTransport = function(WinstonTransport, options) {
    var name = WinstonTransport.prototype.name;
    var winstonTransportObject = (new WinstonTransport(options));

    if (name === 'file') {
        this.winstonLogger.remove(WinstonTransport);
        this.winstonFileTransport = winstonTransportObject;
    } else if (name === 'console') {
        this.winstonLogger.remove(WinstonTransport);
        this.winstonConsoleTransport = winstonTransportObject;
    }
    this.winstonLogger.add(winstonTransportObject, options, true);
};

/**
 * Remove winston log transport (semantic like winston remove() [https://github.com/flatiron/winston])
 * @param winstonTransport
 */
Logger.prototype.removeTransport = function(winstonTransport) {
    this.winstonLogger.remove(winstonTransport);
};

    /**
 * @param {number} logLevel
 * @param {String} description
 * @param {Object=} data
 */
Logger.prototype.log = function(logLevel, description, data) {
    var processId, processName, dataMessage, formattedMessage, messageObject;

    if (logLevel >= this.logLevel) {
        processId = this.processId || "unknown";
        processName = this.processDefinition ? this.processDefinition.name : "unknown";

        if (this.logAppender) {

            dataMessage = data ? "[" + getMessageString(data) + "]" : "";
            formattedMessage = "[" + getLogLevelString(logLevel) + "][" + processName + "][" + processId + "][" + description + "]" + dataMessage;
            this.logAppender(formattedMessage);

        } else {

            messageObject = {
                process: processName,
                id: processId,
                description: description
            };
            if (data) {
                messageObject.data = data;
            }
            this.winstonLogger.log(getLogLevelString(logLevel), messageObject, function(error) {
                if (error) {
                    console.log("Error while logging: " + error);
                }
            });

        }
    }
};

function getLogLevelString(logLevel) {
    var result = "unknown";
    var keys = Object.keys(logLevels);

    keys.forEach(function(key) {
        if (logLevels[key] === logLevel) {
            result = key;
        }
    });
    return result;
}

/**
 * @param {number | string} logLevel
 * @return number
 */
function getLogLevelValue(logLevel) {
    var logLevelValue;

    if (typeof logLevel === 'string') {
        logLevelValue = logLevels[logLevel] || logLevels.error;
    } else {
        logLevelValue = logLevel;
    }
    return logLevelValue;
}

function getMessageString(data) {
    return (typeof data === 'object' ? JSON.stringify(data) : data.toString());
}