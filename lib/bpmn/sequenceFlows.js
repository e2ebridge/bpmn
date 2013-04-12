/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var parserUtilsModule = require("./parserUtils");

/**
 * @param node
 * @constructor
 */
exports.createBPMNSequenceFlow = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
    return (new BPMNSequenceFlow(
        getValue(node, "id"),
        getValue(node, "name"),
        "sequenceFlow",
        getValue(node, "sourceRef"),
        getValue(node, "targetRef"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isSequenceFlowName = function(localName) {
    return (localName.toLowerCase().indexOf("flow") > -1);
};

/**
 * Subsumes all kind of tasks
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {String} sourceRef
 * @param {String} targetRef
 * @constructor
 */
function BPMNSequenceFlow(bpmnId, name, type, sourceRef, targetRef) {
    this.bpmnId = bpmnId;
    this.name = name;
    this.type = type;
    this.sourceRef = sourceRef;
    this.targetRef = targetRef;
    this.isSequenceFlow = true;
}
exports.BPMNSequenceFlow = BPMNSequenceFlow;
