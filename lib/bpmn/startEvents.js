/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var parserUtilsModule = require("./parserUtils");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

util.inherits(BPMNStartEvent, BPMNFlowObject);

/**
 * @param node
 * @return {BPMNStartEvent}
 */
exports.createBPMNStartEvent = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
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
 * @param {Array.<String>=} incomingRefs
 * @param {Array.<String>=} outgoingRefs
 * @constructor
 */
function BPMNStartEvent(bpmnId, name, type, incomingRefs, outgoingRefs) {
    BPMNFlowObject.call(this, bpmnId, name, type, incomingRefs, outgoingRefs);
}
exports.BPMNStartEvent = BPMNStartEvent;
