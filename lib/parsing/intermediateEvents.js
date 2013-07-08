/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var util = require('util');
var parserUtils = require("./parserUtils.js");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

/**
 * @param node
 * @return {BPMNIntermediateThrowEvent}
 */
exports.createBPMNIntermediateThrowEvent = function(node) {
    var getValue = parserUtils.getAttributesValue;
    return (new BPMNIntermediateThrowEvent(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isIntermediateThrowEventName = function(localName) {
    return (localName === "intermediateThrowEvent");
};

/**
 * Subsumes all kind of end events
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
var BPMNIntermediateThrowEvent = exports.BPMNIntermediateThrowEvent = function(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isIntermediateThrowEvent = true;
};
util.inherits(BPMNIntermediateThrowEvent, BPMNFlowObject);

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNIntermediateThrowEvent.prototype.validate = function(processDefinition, errorQueue) {
    validateIntermediateEvent(this, processDefinition, errorQueue);
};

/**
 * @param node
 * @return {BPMNIntermediateCatchEvent}
 */
exports.createBPMNIntermediateCatchEvent = function(node) {
    var getValue = parserUtils.getAttributesValue;
    return (new BPMNIntermediateCatchEvent(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isIntermediateCatchEventName = function(localName) {
    return (localName === "intermediateCatchEvent");
};

/**
 * Subsumes all kind of end events
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
var BPMNIntermediateCatchEvent = exports.BPMNIntermediateCatchEvent = function(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isIntermediateCatchEvent = true;
};
util.inherits(BPMNIntermediateCatchEvent, BPMNFlowObject);

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNIntermediateCatchEvent.prototype.validate = function(processDefinition, errorQueue) {
    validateIntermediateEvent(this, processDefinition, errorQueue);
};

/**
 * @param {BPMNIntermediateCatchEvent | BPMNIntermediateThrowEvent} event
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
function validateIntermediateEvent(event, processDefinition, errorQueue) {
    event.assertName(errorQueue);
    event.assertIncomingSequenceFlows(processDefinition, errorQueue);
    event.assertOneOutgoingSequenceFlow(processDefinition, errorQueue);
}