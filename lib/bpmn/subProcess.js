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
var processDefinitionModule = require('./processDefinition.js');
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
//        // a lot of code to call the method of the super class
//        var flowObject = new BPMNFlowObject(currentSubProcess.bpmnId, currentSubProcess.name, currentSubProcess.type);
//        flowObject.emitTokens(process, data);
//    } else {
//        var subProcessName = currentSubProcess.name;
//        var subProcessId = process.processId + "::" + subProcessName;
//        var bpmnFilePath = currentSubProcess.location;
//        var processDefinition = processDefinitionModule.getBPMNProcessDefinition(bpmnFilePath);
//
//        var mockupHandler = handlerModule.getHandlerFromProcess(subProcessName, process);
//        var handler = mockupHandler && typeof mockupHandler === "object" ? mockupHandler : handlerModule.getHandlerFromFile(bpmnFilePath);
//        handler.doneLoadingHandler = handler.doneLoadingHandler || process.doneLoadingHandler;
//        handler.doneSavingHandler = handler.doneSavingHandler || process.doneSavingHandler;
//
//        // For sub-processes the history becomes hierarchical
//        var currentHistoryEntry = process.history.getLastEntry(subProcessName);
//        currentHistoryEntry.subProcessHistory = new BPMNProcessHistory();
//
//        // At atomic states we would just emit tokens from here. But this is a hierarchical activity that starts
//        // a the sub-process. To model this, we create a token representing the subProcess.
//        // This token holds the state in the current process (= its position) and the state of the whole sub-process
//        var state = process.state;
//        var subProcessToken = state.createTokenAt(subProcessName, process.processId);
//        var subProcess = createBPMNProcess(subProcessId, processDefinition, handler,
//            process.persistency, process, subProcessToken, currentHistoryEntry.subProcessHistory);
//        subProcessToken.substate = subProcess.getState();
//
//        var startEvents = processDefinition.getStartEvents();
//        if (startEvents.length === 1) {
//            subProcess.sendStartEvent(startEvents[0].name);
//        } else {
//            throw Error("The sub-process '" + processDefinition.name + "' must have exactly one start event.");
//        }
//    }
//};

