/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var parserUtilsModule = require("./parserUtils");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

util.inherits(BPMNBoundaryEvent, BPMNFlowObject);

/**
 * @param node
 * @return {BPMNBoundaryEvent}
 */
exports.createBPMNBoundaryEvent = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
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
function BPMNBoundaryEvent(bpmnId, name, type, attachedToRef) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isBoundaryEvent = true;
    this.attachedToRef = attachedToRef;
}
exports.BPMNBoundaryEvent = BPMNBoundaryEvent;

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {ErrorQueue} errorQueue
 */
BPMNBoundaryEvent.prototype.validate = function(processDefinition, errorQueue) {
    this.assertName(errorQueue);
    this.assertNoIncomingSequenceFlows(processDefinition, errorQueue);
    this.assertOneOutgoingSequenceFlow(processDefinition, errorQueue)
};