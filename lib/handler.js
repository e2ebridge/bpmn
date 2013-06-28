/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

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
    var result;
    var done = handlerDoneCallback || function() {};
    var eventType = "callHandler";

    var handler = getHandlerFromProcess(name, process);
    if (handler) {
        var handlerType = typeof handler;
        if (handlerType === 'function') {
            try {
                result = handler.call(process.processClient, data, done);
            } catch (error) {
                process.logger.error("Error in handler '" + name + "': " + error.toString());
                process.defaultErrorHandler.call(process.processClient, error, done);
            }
        } else if (handlerType === 'object') {
            // hierarchical handler used for mocking up sub process handlers. See test cases for examples
            // To keep going we have to call done()
            done();
        } else {
            process.callDefaultEventHandler(eventType, name, mapName2HandlerName(name), "Unknown handler type: '" + handlerType + "'", done);
        }
     } else {
        process.callDefaultEventHandler(eventType, name, mapName2HandlerName(name), "No handler found", done);
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
 */
function getHandlerFromProcess(name, process) {
    var handlerName = mapName2HandlerName(name);
    var handler = process.eventHandler[handlerName]; // this works as long as event names are unique
    return handler;
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
