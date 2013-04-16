/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var parserUtilsModule = require("./parserUtils");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

util.inherits(BPMNExclusiveGateway, BPMNFlowObject);
util.inherits(BPMNParallelGateway, BPMNFlowObject);

/**
 * @param node
 * @return {BPMNExclusiveGateway}
 */
exports.createBPMNExclusiveGateway = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
    return (new BPMNExclusiveGateway(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isExclusiveGatewayName = function(localName) {
    return (localName === "exclusiveGateway");
};

/**
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
function BPMNExclusiveGateway(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isExclusiveGateway = true;
}
exports.BPMNExclusiveGateway = BPMNExclusiveGateway;

/**
 * @param node
 * @return {BPMNParallelGateway}
 */
exports.createBPMNParallelGateway = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
    return (new BPMNParallelGateway(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isParallelGatewayName = function(localName) {
    return (localName === "parallelGateway");
};

/**
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
function BPMNParallelGateway(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isParallelGateway = true;
}
exports.BPMNParallelGateway = BPMNParallelGateway;
