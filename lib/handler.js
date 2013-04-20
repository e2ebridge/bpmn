/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fileUtilsModule = require('./utils/file.js');
exports.handlerNameSeparator = '$';

/**
 * @param {String} name
 * @param {BPMNProcess} process
 * @param {Object=} data
 * @param {Function=} handlerDoneCallback
 * @private
 */
exports.callHandler = function(name, process, data, handlerDoneCallback) {
    var result = undefined;
    var done = handlerDoneCallback || function() {};
    var eventType = "callHandler";

    var handler = getHandlerFromProcess(name, process);
    if (handler) {
        var handlerType = typeof handler;
        if (handlerType === 'function') {
            try {
                result = handler.call(process.processClient, data, done);
            } catch (error) {
                process.defaultErrorHandler.call(process.processClient, error);
            }
        } else if (handlerType === 'object') {
            // hierarchical handler used for mocking up sub process handlers. See test cases for examples
            // To keep going we have to call done()
            done();
        } else {
            process.callDefaultEventHandler(eventType, null, mapName2HandlerName(name), "Unknown handler type: '" + handlerType + "'", done);
        }
     } else {
        process.callDefaultEventHandler(eventType, null, mapName2HandlerName(name), "No handler found", done);
    }

    return result;
};

/**
 * @param {String} bpmnFilePath
 * @type {String}
 */
function getHandlerFileName(bpmnFilePath) {
    return (fileUtilsModule.removeFileExtension(bpmnFilePath) + ".js");
}
exports.getHandlerFileName = getHandlerFileName;

/**
 * @param {String} name
 * @param {BPMNProcess} process
 * @return {Function | Object}
 * @private
 */
function getHandlerFromProcess(name, process) {
    var handlerName = mapName2HandlerName(name);
    return process.eventHandler[handlerName]; // this works as long as event names are unique
}
exports.getHandlerFromProcess = getHandlerFromProcess;

/**
 * @param {String} bpmnFilePath
 * @type {Object}
 */
function getHandlerFromFile(bpmnFilePath) {
    var handlerFilePath = getHandlerFileName(bpmnFilePath);
    return require(handlerFilePath);
}
exports.getHandlerFromFile = getHandlerFromFile;

/**
 * Replace all non-allowed characters with '_', if the name starts with a number prefix it with '_'
 * @param {String} name
 * @type {String}
 */
function mapName2HandlerName(name) {
    var cleanName = name.replace(/[:!`~\^@*#¢¬ç?¦\|&;%@"<>\(\){}\[\]\+, \t\n]/g, "_");

    if (cleanName.match(/^[0-9]/)) {
        cleanName = "_" + cleanName;
    }
    return cleanName;
}
exports.mapName2HandlerName = mapName2HandlerName;

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {String} reason
 */
function logDefaultedEvents(eventType, currentFlowObjectName, handlerName, reason) {
    if (currentFlowObjectName) {
        console.log("Unhandled event: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'. Reason: " + reason);
    } else {
        console.log("Unhandled event: '" + eventType + "'. Handler name: " + handlerName + "'. Reason: " + reason);
    }
}
exports.logDefaultedEvents = logDefaultedEvents;

