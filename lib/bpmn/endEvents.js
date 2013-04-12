/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var parserUtilsModule = require("./parserUtils.js");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

util.inherits(BPMNEndEvent, BPMNFlowObject);

/**
 * @param node
 * @return {BPMNEndEvent}
 */
exports.createBPMNEndEvent = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
    return (new BPMNEndEvent(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isEndEventName = function(localName) {
    return (localName.toLowerCase().indexOf("end") > -1);
};

/**
 * Subsumes all kind of end events
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {Array.<String>=} incomingRefs
 * @param {Array.<String>=} outgoingRefs
 * @constructor
 */
function BPMNEndEvent(bpmnId, name, type, incomingRefs, outgoingRefs) {
    BPMNFlowObject.call(this, bpmnId, name, type, incomingRefs, outgoingRefs);
    this.isEndEvent = true;
}
exports.BPMNEndEvent = BPMNEndEvent;
