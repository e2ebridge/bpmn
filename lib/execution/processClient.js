/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {BPMNProcess} bpmnProcess
 * @constructor
 */
function BPMNProcessClient(bpmnProcess) {
    this.bpmnProcess = bpmnProcess;
}
exports.BPMNProcessClient = BPMNProcessClient;

/**
 * @param {String} taskName
 * @param {Object} data
 */
BPMNProcessClient.prototype.taskDone = function(taskName, data) {
    this.bpmnProcess.taskDone(taskName, data);
};

/**
 * @return {BPMNProcessState}
 */
BPMNProcessClient.prototype.getState = function() {
    return this.bpmnProcess.getState();
};

/**
 * @return {Array.<String>}
 */
BPMNProcessClient.prototype.getHistory = function() {
    return this.bpmnProcess.getHistory();
};

/**
 * @param {String} name
 * @param {Object} value
 */
BPMNProcessClient.prototype.setProperty = function(name, value) {
    this.bpmnProcess.setProperty(name, value);
};

/**
 * @param {String} name
 * @return {Object}
 */
BPMNProcessClient.prototype.getProperty = function(name) {
    return this.bpmnProcess.getProperty(name);
};

/**
 * @param {String} eventName
 * @param {Object} data
 */
BPMNProcessClient.prototype.sendStartEvent = function(eventName, data) {
    return this.bpmnProcess.sendStartEvent(eventName, data);
};