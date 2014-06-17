/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var fileUtils = require('./utils/file.js');

exports.handlerNameSeparator = '$';

/**
 * @param {String} name
 * @param {BPMNProcess} process
 * @param {Object=} data
 * @param {Function=} handlerDoneCallback
 * @private
 */
exports.callHandler = function(name, process, data, handlerDoneCallback) {
    var result, handlerType;
    var done = handlerDoneCallback || function() {};
    var eventType = "callHandler";
    var handler = getHandlerFromProcess(name, process);

    if (handler) {
        handlerType = typeof handler;
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
            process.callDefaultEventHandler(eventType, name, mapName2HandlerName(name),
                                            "Unknown handler type: '" + handlerType + "'", done);
        }
     } else {
        process.callDefaultEventHandler(eventType, name, mapName2HandlerName(name), "No handler found", done);
    }

    return result;
};

/**
 * @param {String} bpmnFilePath
 * @return {String}
 */
var getHandlerFileName = exports.getHandlerFileName = function(bpmnFilePath) {
    return (fileUtils.removeFileExtension(bpmnFilePath) + ".js");
};

/**
 * @param {String} name
 * @param {BPMNProcess} process
 * @return {Function | Object}
 */
var getHandlerFromProcess = exports.getHandlerFromProcess = function(name, process) {
    var handlerName = mapName2HandlerName(name);
    var handler = process.eventHandler[handlerName]; // this works as long as event names are unique
    return handler;
};

/**
 * @param {String} bpmnFilePath
 * @return {Object}
 */
exports.getHandlerFromFile = function(bpmnFilePath) {
    var handlerFilePath = getHandlerFileName(bpmnFilePath);
    return require(handlerFilePath);
};

/**
 * @param {String} moduleString
 * @return {Object}
 */
exports.getHandlerFromString = function(moduleString) {
    var Module = require('module').Module;
    var handlerModule = new Module();
    handlerModule._compile(stripBOM(moduleString));
    return handlerModule.exports;
};

function stripBOM(content) {
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    return content;
}

/**
 * Replace all non-allowed characters with '_', if the name starts with a number prefix it with '_'
 * @param {String} name
 * @return {String}
 */
var mapName2HandlerName = exports.mapName2HandlerName = function(name) {
    var cleanName = name.replace(/[:!`~\^@*#¢¬ç?¦\|&;%@"<>\(\){}\[\]\+, \t\n]/g, "_");

    if (cleanName.match(/^[0-9]/)) {
        cleanName = "_" + cleanName;
    }
    return cleanName;
};
