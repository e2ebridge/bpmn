/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var handlerModule = require('../handler.js');
var parserUtilsModule = require("./parserUtils");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isGatewayName = function(localName) {
    return (localName.toLowerCase().indexOf("gateway") > -1);
};

/**
 * @param node
 * @param {String} fileName
 * @param {ErrorQueue} errorQueue
 * @return {BPMNExclusiveGateway|BPMNParallelGateway}
 */
exports.createBPMNGateway = function(node, fileName, errorQueue) {
    var getAttributeValue = parserUtilsModule.getAttributesValue;
    var gateway = null;
    var localName = node.local;
    var name = getAttributeValue(node, "name");
    var id = getAttributeValue(node, "id");
    if (isExclusiveGatewayName(localName)) {
        gateway = new BPMNExclusiveGateway(id, name, node.local);
    } else if (isParallelGatewayName(localName)) {
        gateway = new BPMNParallelGateway(id, name, node.local);
    } else {
        errorQueue.addError("UnsupportedGateway", fileName, "The gateway '" + name + "' is not supported yet.");
    }
    return gateway;
};


/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
isExclusiveGatewayName = function(localName) {
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
util.inherits(BPMNExclusiveGateway, BPMNFlowObject);
exports.BPMNExclusiveGateway = BPMNExclusiveGateway;

/**
 * Semantics: emit token along the first outgoing flow having an event handler that evaluates to true
 * @param {BPMNProcess} process
 * @param {Object} data
 */
BPMNExclusiveGateway.prototype.emitTokens = function(process, data) {
    var self = this;
    var emittedToken = false;
    var outgoingSequenceFlows = process.processDefinition.getOutgoingSequenceFlows(self);
    var isDiverging = outgoingSequenceFlows.length > 1;

    outgoingSequenceFlows.forEach(function(outgoingSequenceFlow){
        if (emittedToken) return;

        if (isDiverging) {
            if (outgoingSequenceFlow.name) {
                var handlerName = self.name + handlerModule.handlerNameSeparator + outgoingSequenceFlow.name;
                if (handlerModule.callHandler(handlerName, process, data)) {
                    process.emitTokenAlong(outgoingSequenceFlow, data);
                    emittedToken = true;
                }
            } else {
                throw new Error("Cannot calculate handler name for gateway '" +
                    self.name + "' because it has unnamed outgoing transitions.");
            }
        } else {
            process.emitTokenAlong(outgoingSequenceFlow, data);
            emittedToken = true;
        }
    });
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
isParallelGatewayName = function(localName) {
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
util.inherits(BPMNParallelGateway, BPMNFlowObject);
exports.BPMNParallelGateway = BPMNParallelGateway;

/**
 * Semantics: wait until all tokens arrive and then emit tokens along all outgoing flows
 * @param {BPMNProcess} process
 * @param {Object} data
 */
BPMNParallelGateway.prototype.emitTokens = function(process, data) {
    var currentGateway = this;
    var state = process.state;

    state.createTokenAt(currentGateway.name, process.processId);

    var numberOfIncomingFlows = process.processDefinition.getIncomingSequenceFlows(currentGateway).length;
    var numberOfTokens = state.numberOfTokensAt(currentGateway);
    if (numberOfTokens === numberOfIncomingFlows) {
        state.removeAllTokensAt(currentGateway);
        var outgoingSequenceFlows = process.processDefinition.getOutgoingSequenceFlows(currentGateway);
        outgoingSequenceFlows.forEach(function(outgoingSequenceFlow){
            process.emitTokenAlong(outgoingSequenceFlow, data);
        });
    }
};