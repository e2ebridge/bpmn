/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;
var BPMNActivity = require("./activity.js").BPMNActivity;
var util = require('util');
var parserUtils = require("./parserUtils");
var path = require('path');
var handlerModule = require('../handler.js');
var bpmnDefinitions = require('./definitions.js');

/**
 * @param node
 * @param {String} baseFileName Name of the current process definition file
 * @param {Object} prefix2NamespaceMap
 * @param {Object} importNamespace2LocationMap
 */
exports.createBPMNCallActivity = function(node, baseFileName, prefix2NamespaceMap, importNamespace2LocationMap) {
    var getValue = parserUtils.getAttributesValue;
    var calledElement = getValue(node, "calledElement");
    var splitName = parserUtils.splitPrefixedName(calledElement);
    var calledElementName = splitName.localName;
    var calledElementNamespace = prefix2NamespaceMap[splitName.prefix];
    var relativeLocation = importNamespace2LocationMap[calledElementNamespace];
    var location = relativeLocation ? path.join(path.dirname(baseFileName), relativeLocation) : "";

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
var BPMNCallActivity = exports.BPMNCallActivity = function(bpmnId, name, type, calledElementName,
                                                           calledElementNamespace, location) {
    BPMNActivity.call(this, bpmnId, name, type);
    this.isCallActivity = true;
    this.calledElementName = calledElementName;
    this.calledElementNamespace = calledElementNamespace;
    this.location = location;
};
util.inherits(BPMNCallActivity, BPMNActivity);

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
    var self = this;
    var callActivityName = self.name;
    var processId = currentProcess.processId;
    var calledProcessId = processId + "::" + callActivityName;
    var callActivityToken, startEvents;

    if (returningFromCalledProcess) {

        BPMNFlowObject.prototype.emitTokens.call(self, currentProcess, data);
        currentProcess.unregisterCalledProcess(calledProcessId);

    } else {

        callActivityToken = currentProcess.state.createTokenAt(callActivityName, processId, calledProcessId);
        self.createCalledProcess(callActivityToken, currentProcess, createBPMNProcess, function(err, calledProcess){
            startEvents = calledProcess.processDefinition.getStartEvents();
            if (startEvents.length === 1) {
                calledProcess.triggerEvent(startEvents[0].name);
            } else {
                throw new Error("The called process '" + calledProcess.processDefinition.name +
                    "' must have exactly one start event.");
            }
        });
    }
};

/**
 * @param {Token} callActivityToken
 * @param {BPMNProcess} currentProcess
 * @param {Function} createBPMNProcess
 * @param {BPMNProcessDefinition=} calledProcessDefinition
 * @param {Function} callback
 * @return {BPMNProcess}
 */
BPMNCallActivity.prototype.createCalledProcess = function(callActivityToken, currentProcess,
                                                          createBPMNProcess, calledProcessDefinition, callback) {

    if(typeof calledProcessDefinition === 'function'){
        callback = calledProcessDefinition;
        calledProcessDefinition = null;
    }

    var handler = this.getHandler(currentProcess);
    var processDefinition = calledProcessDefinition || bpmnDefinitions.getBPMNProcessDefinition(this.location);
    var callActivityHistoryEntry = currentProcess.getHistory().getLastEntry(callActivityToken.position);

    createBPMNProcess(
        callActivityToken.calledProcessId,
        processDefinition,
        handler,
        currentProcess.persistency,
        currentProcess,
        callActivityToken,
        callActivityHistoryEntry,
        function(err, calledProcess){
            if(err){
                return callback(err);
            }

            currentProcess.registerCalledProcess(calledProcess);

            callback(null, calledProcess);
        }
    );
};

/**
 * @param {BPMNProcess} currentProcess
 * @return {Function | Object}
 */
BPMNCallActivity.prototype.getHandler = function(currentProcess) {
    var handler, bpmnFilePath;
    var callActivityName = this.name;
    var mockupHandler = handlerModule.getHandlerFromProcess(callActivityName, currentProcess);

    if (mockupHandler && typeof mockupHandler === "object") {
        handler = mockupHandler;
    } else {
        bpmnFilePath = this.location;
        handler = handlerModule.getHandlerFromFile(bpmnFilePath);
    }

    assignHandler(handler, "defaultEventHandler", currentProcess);
    assignHandler(handler, "defaultErrorHandler", currentProcess);
    assignHandler(handler, "doneSavingHandler", currentProcess);
    assignHandler(handler, "doneLoadingHandler", currentProcess);
    assignHandler(handler, "onBeginHandler", currentProcess);
    assignHandler(handler, "onEndHandler", currentProcess);

    return handler;
};

function assignHandler(handler, name, currentProcess) {
    // If the handler is explicitly given, we use it.
    // Otherwise we use the handler of the current process which is the parent of the called process
    handler[name] = handler[name] || currentProcess[name];
}

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNCallActivity.prototype.validate = function(processDefinition, errorQueue) {
    this.assertName(errorQueue);
    this.assertIncomingSequenceFlows(processDefinition, errorQueue);
    this.assertOutgoingSequenceFlows(processDefinition, errorQueue);

    if (!this.location || this.location === '') {
        errorQueue.addError("CA1", this, "The " + this.type + " '" + this.name + "' must reference another process by its file name.");
    }
};
