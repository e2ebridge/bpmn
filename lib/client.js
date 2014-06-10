/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

/**
 * @param {BPMNProcess} bpmnProcess
 * @constructor
 */
var BPMNProcessClient = exports.BPMNProcessClient = function(bpmnProcess) {
    this._implementation = bpmnProcess;
};

/**
 * @return {BPMNProcess}
 * @private
 */
BPMNProcessClient.prototype._getImplementation = function() {
    return this._implementation;
};

/**
 * @param {String} taskName
 * @param {Object} data
 */
BPMNProcessClient.prototype.taskDone = function(taskName, data) {
    this._getImplementation().taskDone(taskName, data);
};

/**
 * @param {String} eventName
 * @param {Object=} data
 */
BPMNProcessClient.prototype.triggerEvent = function(eventName, data) {
    this._getImplementation().triggerEvent(eventName, data);
};

/**
 * @param {BPMNMessageFlow} messageFlow
 * @param {Object=} data
 */
BPMNProcessClient.prototype.sendMessage = function(messageFlow, data) {
    this._getImplementation().sendMessage(messageFlow, data);
};

/**
 * @param {String}sourceObjectFlowName
 * @return {Array.<BPMNMessageFlow>}
 */
BPMNProcessClient.prototype.getOutgoingMessageFlows = function(sourceObjectFlowName) {
    return this.getProcessDefinition().getMessageFlowsBySourceName(sourceObjectFlowName);
};

/**
 * @return {BPMNProcessState}
 */
BPMNProcessClient.prototype.getState = function() {
    return this._getImplementation().getState();
};

/**
 * @return {BPMNProcessHistory}
 */
BPMNProcessClient.prototype.getHistory = function() {
    return this._getImplementation().getHistory();
};

/**
 * @param {String} name
 * @param {Object} value
 */
BPMNProcessClient.prototype.setProperty = function(name, value) {
    this._getImplementation().setProperty(name, value);
};

/**
 * @param {String} name
 * @return {Object}
 */
BPMNProcessClient.prototype.getProperty = function(name) {
    return this._getImplementation().getProperty(name);
};

/**
 * @return {Object}
 */
BPMNProcessClient.prototype.getProperties = function() {
    return this._getImplementation().getProperties();
};

/**
 * @return {BPMNProcessClient}
 */
BPMNProcessClient.prototype.getParentProcess = function() {
    return this._getImplementation().getParentProcess().processClient;
};

/**
 * @return {BPMNProcessDefinition}
 */
BPMNProcessClient.prototype.getProcessDefinition = function() {
    return this._getImplementation().getProcessDefinition();
};

/**
 * @return {String}
 */
BPMNProcessClient.prototype.getProcessId = function() {
    return this._getImplementation().getProcessId();
};

/**
 * @param {String} participantName
 * @return {BPMNProcessClient}
 */
BPMNProcessClient.prototype.getParticipantByName = function(participantName, callback) {
    this._getImplementation().getParticipantByName(participantName, function(err, bpmnProcess){
        if(err){
            return callback(err);
        }

        callback(null, bpmnProcess.processClient);
    });
};

/**
 * @param {Logger} logger
 */
BPMNProcessClient.prototype.setLogger = function(logger) {
    this._getImplementation().setLogger(logger);
};

/**
 * @param {number | string} logLevel
 */
BPMNProcessClient.prototype.setLogLevel = function(logLevel) {
    this._getImplementation().setLogLevel(logLevel);
};

/**
 * Add winston log transport (semantic like winston add() [https://github.com/flatiron/winston])
 * @param winstonTransport
 * @param options
 */
BPMNProcessClient.prototype.addLogTransport = function(winstonTransport, options) {
    this._getImplementation().addLogTransport(winstonTransport, options);
};

/**
 * Remove winston log transport (semantic like winston remove() [https://github.com/flatiron/winston])
 * @param winstonTransport
 */
BPMNProcessClient.prototype.removeLogTransport = function(winstonTransport) {
    this._getImplementation().removeLogTransport(winstonTransport);
};

/**
 * @param {function(string)} logAppender
 */
BPMNProcessClient.prototype.setLogAppender = function(logAppender) {
    this._getImplementation().setLogAppender(logAppender);
};

/**
 * If we have a persistency layer that requires db connections, they are closed.
 * @param {Function} done
 */

BPMNProcessClient.prototype.closeConnection = function(done) {
    this._getImplementation().closeConnection(done);
};

/**
 * @return {Transaction}
 */
BPMNProcessClient.prototype.getTrx = function() {
    return this._getImplementation().getCurrentTrx();
};

/**
 *
 * @param {String} key
 * @param {String} value
 */
BPMNProcessClient.prototype.traceString = function(key, value) {
    if(this._getImplementation().getCurrentTrx()) {
        this._getImplementation().getCurrentTrx().processValueString(
            this._getImplementation().getProcessDefinition().name,
            this._getImplementation().getProcessId(),
            key,
            value.toString());
    }
};

/**
 *
 * @param {String} key
 * @param {Number} value
 */
BPMNProcessClient.prototype.traceFloat = function(key, value) {
    value = Number(value);
    if(!value){
        value = 0;
    }

    if(this._getImplementation().getCurrentTrx()) {
        this._getImplementation().getCurrentTrx().processValueFloat(
            this._getImplementation().getProcessDefinition().name,
            this._getImplementation().getProcessId(),
            key,
            value);
    }
};

/**
 *
 * @param {String} key
 * @param {Date|Number} value
 */
BPMNProcessClient.prototype.traceDatetime = function(key, value) {
    value = Number(value);
    if(!value){
        value = 0;
    }

    value = new Date(value);

    if(this._getImplementation().getCurrentTrx()) {
        this._getImplementation().getCurrentTrx().processValueDateTime(
            this._getImplementation().getProcessDefinition().name,
            this._getImplementation().getProcessId(),
            key,
            value);
    }
};