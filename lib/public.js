/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessDefinitionModule = require('./bpmn/processDefinition.js');
var handlerModule = require('./handler.js');
var processModule = require('./process.js');
var Persistency = require('./persistency.js').Persistency;

/**
 * A BPMN process having a given processId is created and it's state is loaded if it has been persisted.
 * The doneLoading and doneSaving handler are called after a process has been loaded respectively saved
 * and BEFORE deferred events are emitted.
 * If these handlers are not given, we try to find a "doneLoadingHandler" respectively "doneSavingHandler"
 * in the process event handler file.
 *
 * @param {String} processId
 * @param {String} bpmnFilePath Full qualified file name of the bpmn file to be loaded
 * @param {{persistencyPath: String, doneLoading: Function, doneSaving: Function}} persistencyOptions
 * @return {BPMNProcessClient}
 */
exports.createBPMNProcess = function(processId, bpmnFilePath, persistencyOptions) {
    var processDefinition = bpmnProcessDefinitionModule.getBPMNProcessDefinition(bpmnFilePath);
    var handler = handlerModule.getHandlerFromFile(bpmnFilePath);
    var persistency = null;

    if (persistencyOptions) {
        var persistencyPath = persistencyOptions.persistencyPath;
        persistency =  persistencyPath ? new Persistency({path: persistencyPath}) : null;
        if (persistency) {
            handler.doneLoadingHandler = persistencyOptions.doneLoading || handler.doneLoadingHandler;
            handler.doneSavingHandler = persistencyOptions.doneSaving || handler.doneSavingHandler;
        } else {
            // TODO: Error or warning?
        }
    }

    var bpmnProcess = processModule.createOrGetBPMNProcess(processId, processDefinition, handler, persistency);

    return bpmnProcess.processClient;
};

exports.clearActiveProcessesCache = function() {
    processModule.clearActiveProcessesCache();
};

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
 * @return {BPMNProcessState}
 */
BPMNProcessClient.prototype.getState = function() {
    return this._bpmnProcess.getState();
};

/**
 * @return {Array.<String>}
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
 * @param {String} eventName
 * @param {Object} data
 */
BPMNProcessClient.prototype.sendStartEvent = function(eventName, data) {
    return this._bpmnProcess.sendStartEvent(eventName, data);
};

/**
 * @return {BPMNProcessDefinition}
 */
BPMNProcessClient.prototype.getProcessDefinition = function() {
    return this._bpmnProcess.processDefinition;
};

/**
 * @return {BPMNProcess}
 */
BPMNProcessClient.prototype.getParentProcess = function() {
    return this._bpmnProcess.getParentProcess().processClient;
};