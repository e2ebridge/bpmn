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
 * @param {BPMNProcess} process
 * @param {Object} data
 * @param {Function} createBPMNProcess
 * @param {Boolean=} returningFromCalledProcess
 */
BPMNCallActivity.prototype.emitTokens = function(process, data, createBPMNProcess, returningFromCalledProcess) {
    var currentCallActivity = this;
    if (returningFromCalledProcess) {
        // a lot of code to call the method of the super class
        var flowObject = new BPMNFlowObject(currentCallActivity.bpmnId, currentCallActivity.name, currentCallActivity.type);
        flowObject.emitTokens(process, data);
    } else {
        var callActivityName = currentCallActivity.name;
        var calledProcessId = process.processId + "::" + callActivityName;
        var bpmnFilePath = currentCallActivity.location;
        var processDefinition = bpmnDefinitionsModule.getBPMNProcessDefinition(bpmnFilePath);

        var mockupHandler = handlerModule.getHandlerFromProcess(callActivityName, process);
        var handler = mockupHandler && typeof mockupHandler === "object" ? mockupHandler : handlerModule.getHandlerFromFile(bpmnFilePath);
        handler.doneLoadingHandler = handler.doneLoadingHandler || process.doneLoadingHandler;
        handler.doneSavingHandler = handler.doneSavingHandler || process.doneSavingHandler;

        // For called processes the history becomes hierarchical
        var currentHistoryEntry = process.history.getLastEntry(callActivityName);
        currentHistoryEntry.calledProcessHistory = new BPMNProcessHistory();

        // At atomic states we would just emit tokens from here. But this is a hierarchical activity that starts
        // a the called process. To model this, we create a token representing the callActivity.
        // This token holds the state in the current process (= its position) and the state of the whole called process
        var state = process.state;
        var callActivityToken = state.createTokenAt(callActivityName, process.processId);
        var calledProcess = createBPMNProcess(calledProcessId, processDefinition, handler,
            process.persistency, process, callActivityToken, currentHistoryEntry.calledProcessHistory);
        callActivityToken.substate = calledProcess.getState();

        var startEvents = processDefinition.getStartEvents();
        if (startEvents.length === 1) {
            calledProcess.sendStartEvent(startEvents[0].name);
        } else {
            throw Error("The called process '" + processDefinition.name + "' must have exactly one start event.");
        }
    }
};

