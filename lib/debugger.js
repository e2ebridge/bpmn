/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var restify = require('restify');
var urls = require('url');
var parserUtils = require("./parsing/parserUtils.js");
//var bunyan2winston = require("./utils/bunyan2winston.js");

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
    this.restClient = null;
};

/**
 * @returns {boolean}
 */
DebuggerInterface.prototype.isInDebugger = function() {
    return (global.v8debug !== undefined);
};

/**
 */
DebuggerInterface.prototype.getRestClient = function (baseUrl, logger) {
    var client;
    if (this.restClient) {
        client = this.restClient;
    } else {
        client = createRestClient(baseUrl, logger);
        this.restClient = client;
    }
    return client;
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
        client = self.getRestClient(baseUrl, logger);
        client.post(self.url.pathname, debuggerMessage, function(error, req, res, obj) {
            if (error) {
                logger.error("Error sending position to '" + self.url.href + "'. Error: " + error);
            }
            if (done) {
                logger.debug("DebuggerInterface: Sending '" + JSON.stringify(debuggerMessage) + "' to '" + self.url.href + "'");
                done(error, req, res, obj);
            }
            client.close();
        });
    } catch (e) {
        logger.error("Error sending position to '" + self.url.href + "'. Error: " + e);
        done(e);
    }
};

function createRestClient(baseUrl) {
    var client = restify.createJsonClient({url: baseUrl});
    // TODO: shim does not work (logger is last parameter of createRestClient)
    // var shim = bunyan2winston.createLogger(logger.winstonLogger);
    // var client = restify.createJsonClient({url: baseUrl, log: shim});
    return client;
}
