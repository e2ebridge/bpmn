/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;
var BPMNActivity = require("./activity.js").BPMNActivity;
var BPMNCallActivity = require("./callActivity.js").BPMNCallActivity;
var nodeUtilsModule = require('util');
var parserUtilsModule = require("./parserUtils");
var pathModule = require('path');
var handlerModule = require('../handler.js');

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
    // A sub-process is a special case of a call activity:
    // the process is defined inline instead of being defined in another file
    BPMNCallActivity.prototype.emitTokens.call(this, currentProcess, data, createBPMNProcess, returningFromCalledProcess);
};

/**
 * @param {Token} callActivityToken
 * @param {BPMNProcess} currentProcess
 * @param {Function} createBPMNProcess
 * @return {BPMNProcess}
 */
BPMNSubProcess.prototype.createCalledProcess = function(callActivityToken, currentProcess, createBPMNProcess) {
    var processDefinition = this.processDefinition;
    // A sub-process is a special case of a call activity:
    // the process is defined inline instead of being defined in another file
    return BPMNCallActivity.prototype.createCalledProcess.call(
        this, callActivityToken, currentProcess, createBPMNProcess, processDefinition);
};

/**
 * @param {BPMNProcess} currentProcess
 * @return {Function | Object}
 */
BPMNSubProcess.prototype.getHandler = function(currentProcess) {
    var subProcessName = this.name;
    return handlerModule.getHandlerFromProcess(subProcessName, currentProcess);
};

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNSubProcess.prototype.validate = function(processDefinition, errorQueue) {
    this.assertName(errorQueue);
    this.assertIncomingSequenceFlows(processDefinition, errorQueue);
    this.assertOutgoingSequenceFlows(processDefinition, errorQueue);
};
