/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fileUtilsModule = require('./utils/file.js');
var errorsModule = require('./errors.js');
var bpmnParserModule = require("./bpmn/parser.js");
var BPMNProcess = require('./process.js').BPMNProcess;
var Persistency = require('./persistency.js').Persistency;

var processDefinitionCache = {};

/**
 * A BPMN process having a given processId is created and it's state is loaded if it has been persisted
 * @param {String} processId
 * @param {String} bpmnFilePath Full qualified file nanme of the bpmn file to be loaded
 * @param {String=} persistencyPath
 * @param {Function=} done Called after state has been loaded and BEFORE deferred events are emitted. This callback makes only sense if we have a persistencyPath
 * @return {BPMNProcess}
 */
exports.getBPMNProcess = function(processId, bpmnFilePath, persistencyPath, done) {
    done = done || function() {};

    var persistency = persistencyPath ? new Persistency({path: persistencyPath}) : null;
    var processManager = new ProcessManager(bpmnFilePath);
    var handler = processManager.getHandler();
    var processDefinition = processDefinitionCache[bpmnFilePath];

    if (!processDefinition) {
        // we don't read bpmn files asynchronously (like node is loading js-files also synchronously)
        // but we cache them (again like node)
        processDefinition = processManager.getProcessDefinition();
        processDefinitionCache[bpmnFilePath] = processDefinition;
    }

    var bpmnProcess = new BPMNProcess(processId, processDefinition, handler, persistency);
    bpmnProcess.loadState(done);

    return bpmnProcess.processClient;
};

function getHandlerFileName(processDefinitionFilePath) {
    // TODO: ../ is strange but __dirname is D:\Projects\bpmn.js\lib
    return ("../" + fileUtilsModule.removeFileExtension(processDefinitionFilePath) + ".js");
}

/**
 * @param {string} processDefinitionFilePath
 * @constructor
 */
function ProcessManager(processDefinitionFilePath) {
    this.processDefinitionFilePath = processDefinitionFilePath;
    this.processHandlerFilePath = getHandlerFileName(processDefinitionFilePath);
    this.errorQueue = errorsModule.createErrorQueue();
}
exports.ProcessManager = ProcessManager;

ProcessManager.prototype.getHandler = function() {
  return require(this.processHandlerFilePath);
};

ProcessManager.prototype.getProcessDefinition = function() {

    var processDefinition;
    var processDefinitionFilePath = this.processDefinitionFilePath;
    var errorQueue = this.errorQueue;

    try {
        // we save the definition to avoid unnecessary parsing
        var processDefinitions = bpmnParserModule.parse(processDefinitionFilePath, errorQueue);
        if (processDefinitions.length === 1) {
            processDefinition = processDefinitions[0];
        } else {
            errorQueue.addError(
                "LoadBPMNFile:ProcessNotUnique", processDefinitionFilePath, "The BPMN file '" +
                    processDefinitionFilePath + "'. contains more than one process definition");
        }
    } catch (e) {
        errorQueue.addError(
            "LoadBPMNFile:CannotParse", processDefinitionFilePath, "Could not parse the BPMN file '" +
                processDefinitionFilePath + "'. Error: '" + e + "'");
    }
    errorQueue.check();

    return processDefinition;
};

