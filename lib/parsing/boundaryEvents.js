/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var util = require('util');
var parserUtils = require("./parserUtils");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

/**
 * @param node
 * @return {BPMNBoundaryEvent}
 */
exports.createBPMNBoundaryEvent = function(node) {
    var getValue = parserUtils.getAttributesValue;
    return (new BPMNBoundaryEvent(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local,
        getValue(node, "attachedToRef")
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isBoundaryEventName = function(localName) {
    return (localName === "boundaryEvent");
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isTimerEventName = function(localName) {
    return (localName === "timerEventDefinition");
};

/**
 * Subsumes all kind of start events
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {String} attachedToRef
 * @constructor
 */
var BPMNBoundaryEvent = exports.BPMNBoundaryEvent = function(bpmnId, name, type, attachedToRef) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isBoundaryEvent = true;
    this.attachedToRef = attachedToRef;
};
util.inherits(BPMNBoundaryEvent, BPMNFlowObject);

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNBoundaryEvent.prototype.validate = function(processDefinition, errorQueue) {
    this.assertName(errorQueue);
    this.assertNoIncomingSequenceFlows(processDefinition, errorQueue);
    this.assertOneOutgoingSequenceFlow(processDefinition, errorQueue);
};