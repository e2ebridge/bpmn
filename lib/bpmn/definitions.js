/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var parserUtilsModule = require("./parserUtils");
var bpmnParserModule = require("./parser.js");
var errorQueueModule = require("../errors.js");

var bpmnDefinitionsCache = {};
exports.clearCache = function() {
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
    var bpmnDefinitions = getBPMNDefinitions(bpmnFilePath);
    return getProcessDefinitions(bpmnDefinitions);
};
exports.getBPMNProcessDefinitions = getBPMNProcessDefinitions;

/**
 * @param bpmnFilePath
 * @return {Array.<BPMNCollaborationDefinition>}
 */
getBPMNCollaborationDefinitions = function(bpmnFilePath) {
    var bpmnDefinitions = getBPMNDefinitions(bpmnFilePath);
    return getCollaborationDefinitions(bpmnDefinitions);
};
exports.getBPMNCollaborationDefinitions = getBPMNCollaborationDefinitions;

function getCollaborationDefinitions(bpmnDefinitions) {
    return bpmnDefinitions.filter(function(definition) {
        return definition.isCollaborationDefinition;
    });
}

function getProcessDefinitions(bpmnDefinitions) {
    return bpmnDefinitions.filter(function(definition) {
        return definition.isProcessDefinition;
    });
}

/**
 * @param {String} bpmnFilePath
 * @return {Array.<BPMNProcessDefinition|BPMNCollaborationDefinition>}
 */
function getBPMNDefinitions(bpmnFilePath) {
    var bpmnDefinitions = bpmnDefinitionsCache[bpmnFilePath];

    if (!bpmnDefinitions) {
        var errorQueue = errorQueueModule.createErrorQueue();

        // we don't read bpmn files asynchronously (like node is loading js-files also synchronously)
        bpmnDefinitions = loadBPMNDefinitions(bpmnFilePath, errorQueue);

        errorQueue.check();

        var collaborationDefinitions = getCollaborationDefinitions(bpmnDefinitions);
        var processDefinitions = getProcessDefinitions(bpmnDefinitions);
        processDefinitions.forEach(function(processDefinition) {
            processDefinition.validate(errorQueue);
            errorQueue.check();
            processDefinition.attachCollaborationDefinitions(collaborationDefinitions);
        });

        bpmnDefinitionsCache[bpmnFilePath] = bpmnDefinitions;
    }

    return bpmnDefinitions;
}

/**
 * @param {String} bpmnFilePath
 * @param {ErrorQueue} errorQueue
 * @return {Array.<BPMNProcessDefinition|BPMNCollaborationDefinition>}
 */
function loadBPMNDefinitions(bpmnFilePath, errorQueue) {

    var bpmnDefinitions = null;
    try {
         bpmnDefinitions = bpmnParserModule.parse(bpmnFilePath, errorQueue);
    } catch (e) {
        errorQueue.addError(
            "LoadBPMNFile:CannotParse", "Could not parse the BPMN file '" + bpmnFilePath + "'. Error: '" + e + "'"
        );
    }

    return bpmnDefinitions;
}
