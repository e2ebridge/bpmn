/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

// Name according to http://de.wikipedia.org/wiki/Business_Process_Model_and_Notation#Notation
exports.BPMNFlowObject = BPMNFlowObject;

/**
 * Subsumes all kind process elements that have incoming and outgoing flows.
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
function BPMNFlowObject(bpmnId, name, type) {
    this.bpmnId = bpmnId;
    this.name = name;
    this.type = type;
    this.isFlowObject = true;
}
