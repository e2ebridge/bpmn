/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var nodeUtilsModule = require('util');
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

/**
 * Subsumes all kind of tasks
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {Array.<String>=} incomingRefs
 * @param {Array.<String>=} outgoingRefs
 * @constructor
 */
function BPMNActivity(bpmnId, name, type, incomingRefs, outgoingRefs) {
    BPMNFlowObject.call(this, bpmnId, name, type, incomingRefs, outgoingRefs);
    /** @type {Array.<BPMNBoundaryEvent>} */
    this.boundaryEvents = [];
    this.isActivity = true;
    this.hasBoundaryEvents = false;
}
exports.BPMNActivity = BPMNActivity;
nodeUtilsModule.inherits(BPMNActivity, BPMNFlowObject);

/**
 * @param {BPMNBoundaryEvent} boundaryEvent
 */
BPMNActivity.prototype.addBoundaryEvent = function(boundaryEvent) {
    this.boundaryEvents.push(boundaryEvent);
    this.hasBoundaryEvents = true;
};



