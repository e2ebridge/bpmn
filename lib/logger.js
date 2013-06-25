/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var winston = require('winston');

/**
 * @enum {number}
 */
logLevels = {
        silly: 0, // winston
        verbose: 1, // winston
        info: 2, // winston
        warn: 3, // winston
        debug: 4, // winston
        trace: 5,
        error: 6, // winston
        none: 7
};
exports.logLevels = logLevels;

logLevelColors = {
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
function Logger(process, options) {
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
}
exports.Logger = Logger;

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
 * @param {LogLevels | number | string} logLevel
 */
Logger.prototype.setLogLevel = function(logLevel) {
    this.logLevel = getLogLevelValue(logLevel);
    var level = getLogLevelString(this.logLevel);
    this.winstonConsoleTransport.level = level;
    this.winstonFileTransport.level = level;
};

/**
 * Add winston log transport (semantic like winston add() [https://github.com/flatiron/winston])
 * @param winstonTransport
 * @param options
 */
Logger.prototype.addTransport = function(winstonTransport, options) {
   var name = winstonTransport.prototype.name;
   var winstonTransportObject = (new (winstonTransport)(options));
   if (name === 'file') {
       this.winstonLogger.remove(winstonTransport);
       this.winstonFileTransport = winstonTransportObject;
   } else if (name === 'console') {
       this.winstonLogger.remove(winstonTransport);
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
 * @param {LogLevels|number} logLevel
 * @param {String} description
 * @param {Object=} data
 */
Logger.prototype.log = function(logLevel, description, data) {
    if (logLevel >= this.logLevel) {
        var processId = this.processId || "unknown";
        var processName = this.processDefinition ? this.processDefinition.name : "unknown";

        if (this.logAppender) {

            var dataMessage = data ? "[" + getMessageString(data) + "]" : "";
            var formattedMessage = "[" + getLogLevelString(logLevel) + "][" + processName + "][" + processId + "][" + description + "]" + dataMessage;
            this.logAppender(formattedMessage);

        } else {

            var messageObject = {
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
 * @param {LogLevels | number | string} logLevel
 * @return number
 */
function getLogLevelValue(logLevel) {
    var logLevelValue = logLevel;
    if (typeof logLevel === 'string') {
        logLevelValue = logLevels[logLevel] || logLevels.error;
    }
    return logLevelValue;
}

function getMessageString(data) {
    return (typeof data === 'object' ? JSON.stringify(data) : data.toString());
}