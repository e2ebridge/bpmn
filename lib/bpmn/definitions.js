/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var parserUtilsModule = require("./parserUtils");
var bpmnParserModule = require("./parser.js");
var errorQueueModule = require("../errors.js");

var bpmnDefinitionsCache = {};
exports.clearBPMNDefinitionsCache = function() {
    bpmnDefinitionsCache = {};
};

/**
 * @param bpmnFilePath
 * @return {BPMNProcessDefinition}
 */
exports.getBPMNProcessDefinition = function(bpmnFilePath) {
    var processDefinition;
    var processDefinitions = getBPMNProcessDefinitions(bpmnFilePath);

    if (processDefinitions.length === 1) {
        processDefinition = processDefinitions[0];
    } else {
        throw Error("The BPMN file '" + bpmnFilePath + "'. contains more than one process definition. Use 'getBPMNProcessDefinitions' instead of 'getBPMNProcessDefinition'");
    }
    return processDefinition;
};

/**
 * @param bpmnFilePath
 * @return {Array.<BPMNProcessDefinition>}
 */
getBPMNProcessDefinitions = function(bpmnFilePath) {
    var processDefinitions = [];
    var bpmnDefinitions = getBPMNDefinitions(bpmnFilePath);
    var collaborationDefinitions = getCollaborations(bpmnDefinitions);
    bpmnDefinitions.forEach(function(definition) {
        if (definition.isProcessDefinition) {
            collaborationDefinitions.forEach(function(collaborationDefinition) {
                var processParticipant = collaborationDefinition.getParticipantByProcessId(definition.bpmnId);
                 if (processParticipant) {
                     var collaboratingParticipants = collaborationDefinition.getCollaboratingParticipants(definition.bpmnId);
                     definition.name = processParticipant.name;
                     definition.collaboratingParticipants = definition.collaboratingParticipants ?
                         definition.collaboratingParticipants.concat(collaboratingParticipants) : collaboratingParticipants;
                 }
            });

            processDefinitions.push(definition);
        }
    });

    return processDefinitions;
};
exports.getBPMNProcessDefinitions = getBPMNProcessDefinitions;

/**
 * @param bpmnFilePath
 * @return {Array.<BPMNCollaborationDefinition>}
 */
getBPMNCollaborationDefinitions = function(bpmnFilePath) {
    var bpmnDefinitions = getBPMNDefinitions(bpmnFilePath);
    return getCollaborations(bpmnDefinitions);
};
exports.getBPMNCollaborationDefinitions = getBPMNCollaborationDefinitions;

function getCollaborations(bpmnDefinitions) {
    return bpmnDefinitions.filter(function(definition) {
        return definition.isCollaborationDefinition;
    });
}

/**
 * @param {String} bpmnFilePath
 * @return {Array.<BPMNProcessDefinition|BPMNCollaborationDefinition>}
 */
function getBPMNDefinitions(bpmnFilePath) {
    var bpmnDefinitions = bpmnDefinitionsCache[bpmnFilePath];

    if (!bpmnDefinitions) {
        // we don't read bpmn files asynchronously (like node is loading js-files also synchronously)
        // but we cache them (again like node)
        bpmnDefinitions = loadBPMNDefinitions(bpmnFilePath);
        bpmnDefinitionsCache[bpmnFilePath] = bpmnDefinitions;
    }

    return bpmnDefinitions;
}

/**
 * @param {String} bpmnFilePath
 * @return {Array.<BPMNProcessDefinition|BPMNCollaborationDefinition>}
 */
function loadBPMNDefinitions(bpmnFilePath) {

    var bpmnDefinitions = null;
    var errorQueue = errorQueueModule.createErrorQueue();

    try {
         bpmnDefinitions = bpmnParserModule.parse(bpmnFilePath, errorQueue);
    } catch (e) {
        errorQueue.addError(
            "LoadBPMNFile:CannotParse", bpmnFilePath, "Could not parse the BPMN file '" +
                bpmnFilePath + "'. Error: '" + e + "'");
    }

    errorQueue.check();

    return bpmnDefinitions;
}
