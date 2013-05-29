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
 * @param {BPMNProcessDefinition} subProcessDefinition
 */
exports.createBPMNSubProcess = function(node, subProcessDefinition) {
    var getValue = parserUtilsModule.getAttributesValue;
    return (new BPMNSubProcess(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local,
        subProcessDefinition
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isSubProcessName = function(localName) {
    return (localName.toLowerCase().indexOf("subprocess") > -1);
};

/**
 * Subsumes all kind of tasks
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {BPMNProcessDefinition} subProcessDefinition
 * @constructor
 */
function BPMNSubProcess(bpmnId, name, type, subProcessDefinition) {
    BPMNActivity.call(this, bpmnId, name, type);
    this.isSubProcess = true;
    this.processDefinition = subProcessDefinition;
}
nodeUtilsModule.inherits(BPMNSubProcess, BPMNActivity);
exports.BPMNSubProcess = BPMNSubProcess;

/**
 * Semantics: If we are to enter a called processing (returningFromSubProcess = false), the called process is created and a token
 *            is put onto its start state.
 *            If we leave the subProcess we just emit a token.
 * @param {BPMNProcess} currentProcess
 * @param {Object} data
 * @param {Function} createBPMNProcess
 * @param {Boolean=} returningFromCalledProcess
 */
BPMNSubProcess.prototype.emitTokens = function(currentProcess, data, createBPMNProcess, returningFromCalledProcess) {
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
BPMNSubProcess.prototype.createCalledProcess = function(callActivityToken, currentProcess, createBPMNProcess) {
    var handler = this.getHandler(currentProcess);
    var processDefinition = this.processDefinition;
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
BPMNSubProcess.prototype.getHandler = function(currentProcess) {
    var callActivityName = this.name;
    var handler = handlerModule.getHandlerFromProcess(callActivityName, currentProcess);
    handler.doneLoadingHandler = handler.doneLoadingHandler || currentProcess.doneLoadingHandler;
    handler.doneSavingHandler = handler.doneSavingHandler || currentProcess.doneSavingHandler;

    return handler;
};

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {ErrorQueue} errorQueue
 */
BPMNSubProcess.prototype.validate = function(processDefinition, errorQueue) {
    this.assertName(errorQueue);
    this.assertIncomingSequenceFlows(processDefinition, errorQueue);
    this.assertOutgoingSequenceFlows(processDefinition, errorQueue);
};
