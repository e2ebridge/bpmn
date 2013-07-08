/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var util = require('util');
var parserUtils = require("./parserUtils");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

/**
 * @param node
 * @return {BPMNStartEvent}
 */
exports.createBPMNStartEvent = function(node) {
    var getValue = parserUtils.getAttributesValue;

    return (new BPMNStartEvent(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isStartEventName = function(localName) {
    return (localName.toLowerCase().indexOf("start") > -1);
};

/**
 * Subsumes all kind of start events
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
var BPMNStartEvent = exports.BPMNStartEvent = function(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isStartEvent = true;
};
util.inherits(BPMNStartEvent, BPMNFlowObject);

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNStartEvent.prototype.validate = function(processDefinition, errorQueue) {
    this.assertName(errorQueue);
    this.assertNoIncomingSequenceFlows(processDefinition, errorQueue);
    this.assertOneOutgoingSequenceFlow(processDefinition, errorQueue);
};