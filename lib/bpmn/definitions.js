/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var parserUtilsModule = require("./parserUtils");
var bpmnParserModule = require("./parser.js");
var errorQueueModule = require("../errors.js");

var processDefinitionCache = {};
exports.clearProcessDefinitionCache = function() {
    processDefinitionCache = {};
};

/**
 * @param bpmnFilePath
 * @return {BPMNProcessDefinition}
 */
exports.getBPMNProcessDefinition = function(bpmnFilePath) {
   var processDefinition = processDefinitionCache[bpmnFilePath];

    if (!processDefinition) {
        // we don't read bpmn files asynchronously (like node is loading js-files also synchronously)
        // but we cache them (again like node)
        processDefinition = loadProcessDefinition(bpmnFilePath);
        processDefinitionCache[bpmnFilePath] = processDefinition;
    }
    return processDefinition;
};

/**
 * @param {String} bpmnFilePath
 * @return {BPMNProcessDefinition}
 */
function loadProcessDefinition(bpmnFilePath) {

    var processDefinition;
    var errorQueue = errorQueueModule.createErrorQueue();

    try {
        // we save the definition to avoid unnecessary parsing
        var processDefinitions = bpmnParserModule.parse(bpmnFilePath, errorQueue);
        if (processDefinitions.length === 1) {
            /** @type {BPMNProcessDefinition} */
            processDefinition = processDefinitions[0];
        } else {
            errorQueue.addError(
                "LoadBPMNFile:ProcessNotUnique", bpmnFilePath, "The BPMN file '" +
                    bpmnFilePath + "'. contains more than one process definition");
        }
    } catch (e) {
        errorQueue.addError(
            "LoadBPMNFile:CannotParse", bpmnFilePath, "Could not parse the BPMN file '" +
                bpmnFilePath + "'. Error: '" + e + "'");
    }
    errorQueue.check();

    return processDefinition;
}
