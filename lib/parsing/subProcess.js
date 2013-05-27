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
 * @param {BPMNProcess} process
 * @param {Object} data
 * @param {Function} createBPMNProcess
 * @param {Boolean=} returningFromSubProcess
 */
//BPMNSubProcess.prototype.emitTokens = function(process, data, createBPMNProcess, returningFromSubProcess) {
//    var currentSubProcess = this;
//    if (returningFromSubProcess) {
//    } else {
//    }
//};

