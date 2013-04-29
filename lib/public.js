/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnDefinitionsModule = require('./bpmn/definitions.js');
var handlerModule = require('./handler.js');
var processModule = require('./process.js');
var Persistency = require('./persistency.js').Persistency;

exports.clearActiveProcessesCache = function() {
    processModule.clearActiveProcessesCache();
    bpmnDefinitionsModule.clearBPMNDefinitionsCache();
};

/**
 * A BPMN process having a given processId is created and it's state is loaded if it has been persisted.
 * The doneLoading and doneSaving handler are called after a process has been loaded respectively saved
 * and BEFORE deferred events are emitted.
 * If these handlers are not given, we try to find a "doneLoadingHandler" respectively "doneSavingHandler"
 * in the process event handler file.
 *
 * @param {String} processId
 * @param {String} bpmnFilePath Full qualified file name of the bpmn file to be loaded
 * @param {{persistencyPath: String, doneLoading: Function, doneSaving: Function}=} persistencyOptions
 * @return {BPMNProcessClient}
 */
exports.createBPMNProcess = function(processId, bpmnFilePath, persistencyOptions) {
    var processDefinition;
    var processDefinitions = bpmnDefinitionsModule.getBPMNProcessDefinitions(bpmnFilePath);

    if (processDefinitions.length === 1) {
        processDefinition = processDefinitions[0];
    } else {
        throw Error("The BPMN file '" + bpmnFilePath + "'. contains more than one process definition. Use 'createCollaboratingBPMNProcesses' instead of 'createBPMNProcess'");
    }

    var bpmnProcess = createBPMNProcess(processId, bpmnFilePath, processDefinition, persistencyOptions);

    return bpmnProcess.processClient;
};

/**
 * An array of BPMN processes having a given processId are created and their state is loaded if it has been persisted.
 * The doneLoading and doneSaving handler are called after a process has been loaded respectively saved
 * and BEFORE deferred events are emitted.
 * If these handlers are not given, we try to find a "doneLoadingHandler" respectively "doneSavingHandler"
 * in the process event handler file.
 *
 * @param {Array.<{name: String, id: String}>} processDescriptors
 * @param {String} bpmnFilePath Full qualified file name of the bpmn file to be loaded
 * @param {{persistencyPath: String, doneLoading: Function, doneSaving: Function}=} persistencyOptions
 * @return {Array.<BPMNProcessClient>}
 */
exports.createCollaboratingBPMNProcesses = function(processDescriptors, bpmnFilePath, persistencyOptions) {
    var processes = [];
    var processDefinitions = bpmnDefinitionsModule.getBPMNProcessDefinitions(bpmnFilePath);

    processDefinitions.forEach(function(processDefinition) {
        var processId = getProcessId(processDescriptors, processDefinition.name, bpmnFilePath);
        var bpmnProcess = createBPMNProcess(processId, bpmnFilePath, processDefinition, persistencyOptions);
        var participants = processDefinition.getCollaboratingParticipants();
        participants.forEach(function(participant) {
            var participantName = participant.name;
            var participantProcessId = getProcessId(processDescriptors, participantName, bpmnFilePath);
            bpmnProcess.addParticipantId(participantName, participantProcessId);
        });
        processes.push(bpmnProcess.processClient);
    });

    return processes;
};

/**
 * Maps bpmn names to valid handler names.
 * @param {String} bpmnName
 * @type {String}
 */
exports.mapName2HandlerName = function(bpmnName) {
    return handlerModule.mapName2HandlerName(bpmnName);
};

function getProcessId(processDescriptors, processName, bpmnFilePath) {
    var result;
    var results = processDescriptors.filter(function(processId) {
        return (processId.name === processName);
    });

    if (results.length === 1) {
        result = results[0].id;
    } else {
        if (results.length === 0) {
            throw Error("Could not find the process pool '" + processName + "' in the process definitions file '" + bpmnFilePath + "'");
        } else {
            throw Error("Found more than one process pool '" + processName + "' in the process definitions file '" + bpmnFilePath + "'");
        }
    }

    return result;
}

function createBPMNProcess(processId, bpmnFilePath, processDefinition, persistencyOptions) {
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

    return processModule.createOrGetBPMNProcess(processId, processDefinition, handler, persistency);
}


