/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var restify = require('restify');
var urls = require('url');
var parserUtils = require("./parsing/parserUtils.js");

/**
 * @param node
 * @param {String} fileName
 * @constructor
 */
exports.createDebuggerInterface = function(node, fileName) {
    return (new DebuggerInterface(parserUtils.getAttributesValue(node, "href"), fileName));
};

/**
 * @param node
 * @return {Boolean}
 */
exports.isDebuggerElement = function(node) {
    return (node.uri === 'http://e2e.ch/bpmneditor/debugger' && node.local === 'position');
};

/**
 * @param {String} url
 * @param {String} fileName
 * @constructor
 */
var DebuggerInterface = exports.DebuggerInterface = function(url, fileName) {
    this.fileName = fileName;
    this.url = urls.parse(url);
};

/**
 * @returns {boolean}
 */
DebuggerInterface.prototype.isInDebugger = function() {
    return (global.v8debug !== undefined);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @param {Logger} logger
 * @param {Function} done
 */
DebuggerInterface.prototype.sendPosition = function(flowObject, logger, done) {
    var self = this;
    var baseUrl = self.url.protocol + '//' + self.url.host;
    var debuggerMessage = {
        filename: this.fileName,
        position: {}
    };
    var client;

    if (flowObject.bpmnId) {
        debuggerMessage.position.bpmnId = flowObject.bpmnId;
    }

    try {
        // if we are here, we are debugging so performance is no issue so
        // we create a new client all the time which is simple and robust
        client = self.createRestClient(baseUrl);
        client.post(self.url.pathname, debuggerMessage, function(error, req, res, obj) {
            if (error) {
                logger.error("Error sending position to '" + self.url.href + "'. Error: " + error);
            }

			// client must be closed before calling done() because done might lead to another sendPosition call
            client.close();

            if (done) {
                logger.debug("DebuggerInterface: Sending '" + JSON.stringify(debuggerMessage) + "' to '" + self.url.href + "'");
                done(error, req, res, obj);
            }
         });
    } catch (e) {
        logger.error("Error sending position to '" + self.url.href + "'. Error: " + e);
        done(e);
    }
};

/**
 * @param {String} url
 * @return {*}
 */
DebuggerInterface.prototype.createRestClient = function(url) {
    return restify.createJsonClient({url: url});
};
