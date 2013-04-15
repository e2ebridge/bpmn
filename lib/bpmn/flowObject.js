/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

// Name according to http://de.wikipedia.org/wiki/Business_Process_Model_and_Notation#Notation
exports.BPMNFlowObject = BPMNFlowObject;

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isOutgoingRefName = function(localName) {
    return (localName === "outgoing");
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isIncomingRefName = function(localName) {
    return (localName === "incoming");
};

/**
 * Subsumes all kind process elements that have incoming and outgoing flows.
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {Array.<String>=} incomingRefs
 * @param {Array.<String>=} outgoingRefs
 * @constructor
 */
function BPMNFlowObject(bpmnId, name, type, incomingRefs, outgoingRefs) {
    this.bpmnId = bpmnId;
    this.name = name;
    this.type = type;
    this.incomingRefs = incomingRefs || [];
    this.outgoingRefs = outgoingRefs || [];
    this.isFlowObject = true;
 }

/**
 * @param {String} outgoingRef
 */
BPMNFlowObject.prototype.addOutgoingRef = function(outgoingRef) {
    this.outgoingRefs.push(outgoingRef);
};

/**
 * @param {String} incomingRef
 */
BPMNFlowObject.prototype.addIncomingRef = function(incomingRef) {
    this.incomingRefs.push(incomingRef);
};



/**
 * @return {int}
 */
BPMNFlowObject.prototype.getNumberOfOutgoingFlows = function() {
    return this.outgoingRefs.length;
};

/**
 * @return {int}
 */
BPMNFlowObject.prototype.getNumberOfIncomingFlows = function() {
    return this.incomingRefs.length;
};

/**
 * @return {Boolean}
 */
BPMNFlowObject.prototype.isDiverging = function() {
    return (this.getNumberOfOutgoingFlows() > 1);
};