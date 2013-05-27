/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var parserUtilsModule = require("./parserUtils.js");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

/**
 * @param node
 * @return {BPMNIntermediateThrowEvent}
 */
exports.createBPMNIntermediateThrowEvent = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
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
function BPMNIntermediateThrowEvent(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isIntermediateThrowEvent = true;
}
util.inherits(BPMNIntermediateThrowEvent, BPMNFlowObject);
exports.BPMNIntermediateThrowEvent = BPMNIntermediateThrowEvent;

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {ErrorQueue} errorQueue
 */
BPMNIntermediateThrowEvent.prototype.validate = function(processDefinition, errorQueue) {
    validateIntermediateEvent(this, processDefinition, errorQueue);
};

/**
 * @param node
 * @return {BPMNIntermediateCatchEvent}
 */
exports.createBPMNIntermediateCatchEvent = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
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
function BPMNIntermediateCatchEvent(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isIntermediateCatchEvent = true;
}
util.inherits(BPMNIntermediateCatchEvent, BPMNFlowObject);

exports.BPMNIntermediateCatchEvent = BPMNIntermediateCatchEvent;

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {ErrorQueue} errorQueue
 */
BPMNIntermediateCatchEvent.prototype.validate = function(processDefinition, errorQueue) {
    validateIntermediateEvent(this, processDefinition, errorQueue);
};

/**
 * @param {BPMNIntermediateCatchEvent | BPMNIntermediateThrowEvent} event
 * @param {BPMNProcessDefinition} processDefinition
 * @param {ErrorQueue} errorQueue
 */
function validateIntermediateEvent(event, processDefinition, errorQueue) {
    event.assertName(errorQueue);
    event.assertIncomingSequenceFlows(processDefinition, errorQueue);
    event.assertOneOutgoingSequenceFlow(processDefinition, errorQueue);
}