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
        this.logLevel = options.logLevel || this.logLevel;
    }

    /** {function(string)} */
    this.logAppender = null; // used for example to test log messages

    this.winstonFileTransport = new (winston.transports.File)({
        level: getLogLevelString(this.logLevel), //TODO: this should work, but it doesn't. Why?
        //level: 'verbose',
        filename: './process.log',
        maxsize: 64 * 1024 * 1024,
        maxFiles: 100,
        timestamp: function() {
            return Date.now();
        }
    });
    this.winstonConsoleTransport = new (winston.transports.Console)({
        level: getLogLevelString(this.logLevel),
        colorize: true
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
 * @param {BPMNProcessClient|BPMNProcess} process
 */
Logger.prototype.setProcess = function(process) {
    if (process) {
        this.processDefinition = process.getProcessDefinition();
        this.processId = process.getProcessId();
    } else {
        this.processDefinition = {};
        this.processId = "unknown";
    }
};

/**
 * @param {LogLevels | number | string} logLevel
 */
Logger.prototype.setDefaultTransportsLogLevel = function(logLevel) {
    if (typeof logLevel === 'string') {
        this.logLevel = logLevels[logLevel] || logLevels.error;
    } else {
        this.logLevel = logLevel;
    }
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
            this.winstonLogger.log(getLogLevelString(logLevel), JSON.stringify(messageObject), function(error) {
                if (error) {
                    console.log("Error while logging: " + error);
                }
            });

        }
    }
 };

/**
 * @param {String} handlerName
 * @param {Error} error
 */
Logger.prototype.logHandlerError = function(handlerName, error) {
    this.log(logLevels.error, "Error in handler '" + handlerName + "': " + error.toString());
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {String} reason
 */
Logger.prototype.logCallDefaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason) {
    this.log(logLevels.error, "Unhandled event: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'. Reason: " + reason);
};

/**
 * @param {String} messageFlowName
 * @param {BPMNFlowObject} source
 * @param {BPMNFlowObject} target
 * @param {Object=} data
 */
Logger.prototype.logSendMessage = function(messageFlowName, source, target, data) {
    var messageName = messageFlowName || "";
    var sourceName = source.name || "";
    var targetName = target.name || "";
    var message = "Send '" + messageName + "' from '" + sourceName + "' to '" + targetName + "'.";
    this.log(logLevels.trace, message, data);
};

/**
 * @param {BPMNFlowObject} event
 * @param {Object=} data
 */
Logger.prototype.logTriggerEvent = function(event, data) {
    this.log(logLevels.trace, "Trigger " + event.type + " '" + event.name + "'", data);
};

/**
 * @param {String} taskName
 * @param {Object=} data
 */
Logger.prototype.logTaskDone = function(taskName, data) {
    this.log(logLevels.trace, "Task '" + taskName + " ' done.", data);
};

/**
 * @param {String} eventName
 * @param {Object=} data
 */
Logger.prototype.logCatchBoundaryEvent = function(eventName, data) {
    this.log(logLevels.trace, "Catch boundary event '" + eventName + " ' done.", data);
};

/**
 * @param {BPMNFlowObject} event
 */
Logger.prototype.logTriggerDeferredEvents = function(event) {
    this.log(logLevels.trace, "Emit deferred events " + event.type + " '" + event.name + "'", event.data);
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {Object=} data
 */
Logger.prototype.logCallHandler = function(eventType, currentFlowObjectName, handlerName, data) {
    this.log(logLevels.trace, "Call handler for: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'.", data);
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 */
Logger.prototype.logCallHandlerDone = function(eventType, currentFlowObjectName, handlerName) {
    this.log(logLevels.trace, "Call handlerDone for: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'.");
};

/**
 @param {BPMNBoundaryEvent} timerEvent
 */
Logger.prototype.logBoundaryTimerEvent = function(timerEvent) {
    this.log(logLevels.trace, "Caught boundary timer event: '" + timerEvent.name + "'.");
};

/**
 @param {BPMNIntermediateCatchEvent} timerEvent
 */
Logger.prototype.logIntermediateCatchTimerEvent = function(timerEvent) {
    this.log(logLevels.trace, "Caught intermediate timer event: '" + timerEvent.name + "'.");
};

/**
 * @param {String} timerEventName
 * @param {Number} timeoutInMs
 */
Logger.prototype.logSetTimer = function(timerEventName, timeoutInMs) {
    this.log(logLevels.debug, "Set timer for '" + timerEventName + "'. Timeout in " + timeoutInMs);
};

/**
 * @param {String} flowObjectName
 * @param {Object=} data
 */
Logger.prototype.logPutTokenAt = function(flowObjectName, data) {
    this.log(logLevels.debug, "Token was put on '" + flowObjectName + "'", data);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @param {Object=} data
 */
Logger.prototype.logTokenArrivedAt = function(flowObject, data) {
    this.log(logLevels.debug, "Token arrived at " + flowObject.type + " '" + flowObject.name + "'", data);
};

/**
 * @param {Object=} savedData
 */
Logger.prototype.logDoneSaving = function(savedData) {
    this.log(logLevels.debug, "SavedData", savedData);
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

function getMessageString(data) {
    return (typeof data === 'object' ? JSON.stringify(data) : data.toString());
}