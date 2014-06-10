/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var util = require('util');
var parserUtils = require("./parserUtils");
var handler = require('../handler.js');

var BPMNActivity = require("./activity.js").BPMNActivity;
var BPMNCallActivity = require("./callActivity.js").BPMNCallActivity;

/**
 * @param node
 * @param {BPMNProcessDefinition} subProcessDefinition
 */
exports.createBPMNSubProcess = function(node, subProcessDefinition) {
    var getValue = parserUtils.getAttributesValue;

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
 var BPMNSubProcess = exports.BPMNSubProcess = function(bpmnId, name, type, subProcessDefinition) {
    BPMNActivity.call(this, bpmnId, name, type);
    this.isSubProcess = true;
    this.processDefinition = subProcessDefinition;
};
util.inherits(BPMNSubProcess, BPMNActivity);


/**
 * Semantics: If we are to enter a called processing (returningFromSubProcess = false), the called process is
 *            created and a token is put onto its start state. If we leave the subProcess we just emit a token.
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
 * @param {Function} callback
 */
BPMNSubProcess.prototype.createCalledProcess = function(callActivityToken, currentProcess, createBPMNProcess, callback) {
    var processDefinition = this.processDefinition;
    // A sub-process is a special case of a call activity:
    // the process is defined inline instead of being defined in another file
    BPMNCallActivity.prototype.createCalledProcess.call(
        this, callActivityToken, currentProcess, createBPMNProcess, processDefinition, callback);
};

/**
 * @param {BPMNProcess} currentProcess
 * @return {Function | Object}
 */
BPMNSubProcess.prototype.getHandler = function(currentProcess) {
    var subProcessName = this.name;
    return handler.getHandlerFromProcess(subProcessName, currentProcess);
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
