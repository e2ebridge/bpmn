/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var parserUtilsModule = require("./parserUtils.js");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

util.inherits(BPMNIntermediateThrowEvent, BPMNFlowObject);

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
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isMessageEventName = function(localName) {
    return (localName === "messageEventDefinition");
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
exports.BPMNIntermediateThrowEvent = BPMNIntermediateThrowEvent;
