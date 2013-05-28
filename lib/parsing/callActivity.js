/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;
var BPMNActivity = require("./activity.js").BPMNActivity;
var nodeUtilsModule = require('util');
var parserUtilsModule = require("./parserUtils");
var pathModule = require('path');
var handlerModule = require('../handler.js');
var bpmnDefinitionsModule = require('./definitions.js');
var BPMNProcessHistory = require("../history.js").BPMNProcessHistory;

/**
 * @param node
 * @param {String} baseFileName Name of the current process definition file
 * @param {Object} prefix2NamespaceMap
 * @param {Object} importNamespace2LocationMap
 */
exports.createBPMNCallActivity = function(node, baseFileName, prefix2NamespaceMap, importNamespace2LocationMap) {
    var getValue = parserUtilsModule.getAttributesValue;

    var calledElement = getValue(node, "calledElement");
    var splitName = parserUtilsModule.splitPrefixedName(calledElement);
    var calledElementName = splitName.localName;
    var calledElementNamespace = prefix2NamespaceMap[splitName.prefix];
    var relativeLocation = importNamespace2LocationMap[calledElementNamespace];
    var location = pathModule.join(pathModule.dirname(baseFileName), relativeLocation);

    return (new BPMNCallActivity(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local,
        calledElementName,
        calledElementNamespace,
        location
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isCallActivityName = function(localName) {
    return (localName.toLowerCase().indexOf("call") > -1);
};

/**
 * Subsumes all kind of tasks
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {String} calledElementName
 * @param {String} calledElementNamespace
 * @param {String} location
 * @constructor
 */
function BPMNCallActivity(bpmnId, name, type, calledElementName, calledElementNamespace, location) {
    BPMNActivity.call(this, bpmnId, name, type);
    this.isCallActivity = true;
    this.calledElementName = calledElementName;
    this.calledElementNamespace = calledElementNamespace;
    this.location = location;
}
nodeUtilsModule.inherits(BPMNCallActivity, BPMNActivity);
exports.BPMNCallActivity = BPMNCallActivity;

/**
 * Semantics: If we are to enter a called processing (returningFromCalledProcess = false), the called process is created and a token
 *            is put onto its start state.
 *            If we leave the callActivity we just emit a token.
 * @param {BPMNProcess} currentProcess
 * @param {Object} data
 * @param {Function} createBPMNProcess
 * @param {Boolean=} returningFromCalledProcess
 */
BPMNCallActivity.prototype.emitTokens = function(currentProcess, data, createBPMNProcess, returningFromCalledProcess) {
    var currentCallActivity = this;
    var callActivityName = currentCallActivity.name;
    var calledProcessId = currentProcess.processId + "::" + callActivityName;

    if (returningFromCalledProcess) {

        var flowObject = new BPMNFlowObject(currentCallActivity.bpmnId, currentCallActivity.name, currentCallActivity.type);
        flowObject.emitTokens(currentProcess, data);
        currentProcess.unregisterCalledProcess(calledProcessId);

    } else {

        var callActivityToken = currentProcess.state.createTokenAt(callActivityName, currentProcess.processId, calledProcessId);
        var calledProcess = currentCallActivity.createCalledProcess(callActivityToken, currentProcess, createBPMNProcess);

        var startEvents = calledProcess.processDefinition.getStartEvents();
        if (startEvents.length === 1) {
            calledProcess.triggerEvent(startEvents[0].name);
        } else {
            throw Error("The called process '" + calledProcess.processDefinition.name + "' must have exactly one start event.");
        }
    }
};

/**
 * @param {Token} callActivityToken
 * @param {BPMNProcess} currentProcess
 * @param {Function} createBPMNProcess
 * @return {BPMNProcess}
 */
BPMNCallActivity.prototype.createCalledProcess = function(callActivityToken, currentProcess, createBPMNProcess) {
    var bpmnFilePath = this.location;
    var handler = this.getHandler(currentProcess);
    var processDefinition = bpmnDefinitionsModule.getBPMNProcessDefinition(bpmnFilePath);
    var callActivityHistoryEntry = currentProcess.getHistory().getLastEntry(callActivityToken.position);

    var calledProcess = createBPMNProcess(
        callActivityToken.calledProcessId,
        processDefinition,
        handler,
        currentProcess.persistency,
        currentProcess,
        callActivityToken,
        callActivityHistoryEntry
    );

    currentProcess.registerCalledProcess(calledProcess);

    return calledProcess;
};

/**
 * @param {BPMNProcess} currentProcess
 * @return {Function | Object}
 */
BPMNCallActivity.prototype.getHandler = function(currentProcess) {
    var callActivityName = this.name;
    var bpmnFilePath = this.location;
    var mockupHandler = handlerModule.getHandlerFromProcess(callActivityName, currentProcess);
    var handler = mockupHandler && typeof mockupHandler === "object" ? mockupHandler : handlerModule.getHandlerFromFile(bpmnFilePath);
    handler.doneLoadingHandler = handler.doneLoadingHandler || currentProcess.doneLoadingHandler;
    handler.doneSavingHandler = handler.doneSavingHandler || currentProcess.doneSavingHandler;

    return handler;
};

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {ErrorQueue} errorQueue
 */
BPMNCallActivity.prototype.validate = function(processDefinition, errorQueue) {
    this.assertName(errorQueue);
    this.assertIncomingSequenceFlows(processDefinition, errorQueue);
    this.assertOutgoingSequenceFlows(processDefinition, errorQueue);
};
