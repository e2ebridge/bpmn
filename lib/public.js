/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnDefinitionsModule = require('./bpmn/definitions.js');
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
    var processDefinition = bpmnDefinitionsModule.getBPMNProcessDefinition(bpmnFilePath);
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

