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
 * @param {String} baseFileName Name of the current process definition file
 * @param {Object} prefix2NamespaceMap
 * @param {Object} importNamespace2LocationMap
 * @constructor
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
 * Semantics: If we are to enter a subprocess (returningFromSubprocess = false), the subprocess is created and a token
 *            is put onto its start state.
 *            If we leave the callActivity we just emit a token.
 * @param {BPMNProcess} process
 * @param {Object} data
 * @param {Function} createBPMNProcess
 * @param {Boolean=} returningFromSubprocess
 */
BPMNCallActivity.prototype.emitTokens = function(process, data, createBPMNProcess, returningFromSubprocess) {
    var currentCallActivity = this;
    if (returningFromSubprocess) {
        // a lot of code to call the method of the super class
        var flowObject = new BPMNFlowObject(currentCallActivity.bpmnId, currentCallActivity.name, currentCallActivity.type);
        flowObject.emitTokens(process, data);
    } else {
        var callActivityName = currentCallActivity.name;
        var subprocessId = process.processId + "::" + callActivityName;
        var bpmnFilePath = currentCallActivity.location;
        var processDefinition = processDefinitionModule.getBPMNProcessDefinition(bpmnFilePath);

        var mockupHandler = handlerModule.getHandlerFromProcess(callActivityName, process);
        var handler = mockupHandler && typeof mockupHandler === "object" ? mockupHandler : handlerModule.getHandlerFromFile(bpmnFilePath);
        handler.doneLoadingHandler = handler.doneLoadingHandler || process.doneLoadingHandler;
        handler.doneSavingHandler = handler.doneSavingHandler || process.doneSavingHandler;

        // For sub-processes the history becomes hierarchical
        var currentHistoryEntry = process.history.getLastEntry(callActivityName);
        currentHistoryEntry.subprocessHistory = new BPMNProcessHistory();

        // At atomic states we would just emit tokens from here. But this is a hierarchical activity that starts
        // a subprocess. To model this, we create a token representing the callActivity.
        // This token holds the state in the current process (= its position) and the state of the whole subprocess
        var state = process.state;
        var callActivityToken = state.createTokenAt(callActivityName, process.processId);
        var subprocess = createBPMNProcess(subprocessId, processDefinition, handler,
            process.persistency, process, callActivityToken, currentHistoryEntry.subprocessHistory);
        callActivityToken.substate = subprocess.getState();

        var startEvents = processDefinition.getStartEvents();
        if (startEvents.length === 1) {
            subprocess.sendStartEvent(startEvents[0].name);
        } else {
            throw Error("The sub-process '" + processDefinition.name + "' must have exactly one start event.");
        }
    }
};

