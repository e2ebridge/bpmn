/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fs = require('fs');

/**
 * @enum {number}
 */
ProcessLogLevel = {
    Error: 0,
    Trace: 1,
    Debug: 2
};
exports.ProcessLogLevel = ProcessLogLevel;

/**
 * @param {BPMNProcess} process
 * @param {String=} logFileName
 * @constructor
 */
function Logger(process, logFileName) {
    this.logFileName = logFileName;
    this.logLevel = ProcessLogLevel.Error;
    this.processDefinition = process.processDefinition;
    this.processId = process.processId;
    /** {function(string)} */
    this.logAppender = null;
}
exports.Logger = Logger;

/**
 * @param {ProcessLogLevel} logLevel
 * @param {String} message
 * @param {Object=} data
 */
Logger.prototype.log = function(logLevel, message, data) {
    if (logLevel <= this.logLevel) {
        var dataMessage = data ? "[" + getMessageString(data) + "]" : "";
        var processId = this.processId;
        var processName = this.processDefinition.name;
        var formattedMessage = "[" + getLogLevelString(logLevel) + "][" + processName + "][" + processId + "][" + message + "]" + dataMessage + "\n";
        if (this.logAppender) {
            this.logAppender(formattedMessage);
        } else if (this.logFileName) {
            fs.appendFile(this.logFileName, formattedMessage);
        } else {
            console.log(formattedMessage);
        }
    }
 };

/**
 * @param {String} handlerName
 * @param {Error} error
 */
Logger.prototype.logHandlerError = function(handlerName, error) {
    this.log(ProcessLogLevel.Error, "Error in handler '" + handlerName + "': " + error.toString());
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
    this.log(ProcessLogLevel.Trace, message, data);
};

/**
 * @param {BPMNFlowObject} event
 * @param {Object=} data
 */
Logger.prototype.logTriggerEvent = function(event, data) {
    this.log(ProcessLogLevel.Trace, "Trigger " + event.type + " '" + event.name + "'", data);
};

/**
 * @param {String} taskName
 * @param {Object=} data
 */
Logger.prototype.logTaskDone = function(taskName, data) {
    this.log(ProcessLogLevel.Trace, "Task '" + taskName + " ' done.", data);
};

/**
 * @param {String} eventName
 * @param {Object=} data
 */
Logger.prototype.logCatchBoundaryEvent = function(eventName, data) {
    this.log(ProcessLogLevel.Trace, "Catch boundary event '" + eventName + " ' done.", data);
};

/**
 * @param {String} flowObjectName
 * @param {Object=} data
 */
Logger.prototype.logPutTokenAt = function(flowObjectName, data) {
    this.log(ProcessLogLevel.Debug, "Token was put on '" + flowObjectName + "'", data);
};

/**
 * @param {BPMNFlowObject} event
 */
Logger.prototype.logEmitDeferredEvents = function(event) {
    this.log(ProcessLogLevel.Trace, "Emit deferred events " + event.type + " '" + event.name + "'", event.data);
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {Object=} data
 */
Logger.prototype.logCallHandler = function(eventType, currentFlowObjectName, handlerName, data) {
    this.log(ProcessLogLevel.Trace, "Call handler for: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'.", data);
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 */
Logger.prototype.logCallHandlerDone = function(eventType, currentFlowObjectName, handlerName) {
    this.log(ProcessLogLevel.Trace, "Call handlerDone for: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'.");
};


/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {String} reason
 */
Logger.prototype.logCallDefaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason) {
    this.log(ProcessLogLevel.Trace, "Unhandled event: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'. Reason: " + reason);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @param {Object=} data
 */
Logger.prototype.logTokenArrivedAt = function(flowObject, data) {
    this.log(ProcessLogLevel.Debug, "Token arrived at " + flowObject.type + " '" + flowObject.name + "'", data);
};

/**
 * @param {Object=} savedData
 */
Logger.prototype.logDoneSaving = function(savedData) {
    this.log(ProcessLogLevel.Debug, "SavedData", savedData);
};

function getLogLevelString(logLevel) {
    var result = "Unknown";
    var keys = Object.keys(ProcessLogLevel);
    keys.forEach(function(key) {
        if (ProcessLogLevel[key] === logLevel) {
            result = key;
        }
    });
    return result;
}

function getMessageString(data) {
    return (typeof data === 'object' ? JSON.stringify(data) : data.toString());
}