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
 * @param {String} taskName
 * @param {Object} data
 */
BPMNProcessClient.prototype.taskDone = function(taskName, data) {
    this._bpmnProcess.taskDone(taskName, data);
};

/**
 * @param {String} eventName
 * @param {Object=} data
 */
BPMNProcessClient.prototype.sendEvent = function(eventName, data) {
    this._bpmnProcess.sendEvent(eventName, data);
};

/**
 * @return {BPMNProcessState}
 */
BPMNProcessClient.prototype.getState = function() {
    return this._bpmnProcess.getState();
};

/**
 * @return {BPMNProcessHistory}
 */
BPMNProcessClient.prototype.getHistory = function() {
    return this._bpmnProcess.getHistory();
};

/**
 * @param {String} name
 * @param {Object} value
 */
BPMNProcessClient.prototype.setProperty = function(name, value) {
    this._bpmnProcess.setProperty(name, value);
};

/**
 * @param {String} name
 * @return {Object}
 */
BPMNProcessClient.prototype.getProperty = function(name) {
    return this._bpmnProcess.getProperty(name);
};

/**
 * @return {BPMNProcessClient}
 */
BPMNProcessClient.prototype.getParentProcess = function() {
    return this._bpmnProcess.getParentProcess().processClient;
};

/**
 * @param {String} participantName
 * @return {BPMNProcessClient}
 */
BPMNProcessClient.prototype.getParticipantByName = function(participantName) {
    return this._bpmnProcess.getParticipantByName(participantName).processClient;
};