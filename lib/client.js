/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {BPMNProcess} bpmnProcess
 * @constructor
 */
function BPMNProcessClient(bpmnProcess) {
    this._bpmnProcess = bpmnProcess;
}
exports.BPMNProcessClient = BPMNProcessClient;

/**
 * @return {BPMNProcess}
 * @private
 */
BPMNProcessClient.prototype._getProcess = function() {
    return this._bpmnProcess;
};

/**
 * @param {String} taskName
 * @param {Object} data
 */
BPMNProcessClient.prototype.taskDone = function(taskName, data) {
    this._getProcess().taskDone(taskName, data);
};

/**
 * @param {String} eventName
 * @param {Object=} data
 */
BPMNProcessClient.prototype.sendEvent = function(eventName, data) {
    this._getProcess().sendEvent(eventName, data);
};

/**
 * @param {BPMNMessageFlow} messageFlow
 * @param {Object=} data
 */
BPMNProcessClient.prototype.sendMessage = function(messageFlow, data) {
    this._getProcess().sendMessage(messageFlow, data);
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
    return this._getProcess().getState();
};

/**
 * @return {BPMNProcessHistory}
 */
BPMNProcessClient.prototype.getHistory = function() {
    return this._getProcess().getHistory();
};

/**
 * @param {String} name
 * @param {Object} value
 */
BPMNProcessClient.prototype.setProperty = function(name, value) {
    this._getProcess().setProperty(name, value);
};

/**
 * @param {String} name
 * @return {Object}
 */
BPMNProcessClient.prototype.getProperty = function(name) {
    return this._getProcess().getProperty(name);
};

/**
 * @return {BPMNProcessClient}
 */
BPMNProcessClient.prototype.getParentProcess = function() {
    return this._getProcess().getParentProcess().processClient;
};

/**
 * @return {BPMNProcessDefinition}
 */
BPMNProcessClient.prototype.getProcessDefinition = function() {
    return this._getProcess().processDefinition;
};

/**
 * @param {String} participantName
 * @return {BPMNProcessClient}
 */
BPMNProcessClient.prototype.getParticipantByName = function(participantName) {
    return this._getProcess().getParticipantByName(participantName).processClient;
};

/**
 * @param {ProcessLogLevel} logLevel
 */
BPMNProcessClient.prototype.setLogLevel = function(logLevel) {
    this._getProcess().setLogLevel(logLevel);
}

/**
 * @param {function(string)} logAppender
 */
BPMNProcessClient.prototype.setLogAppender = function(logAppender) {
    this._getProcess().setLogAppender(logAppender);
}
