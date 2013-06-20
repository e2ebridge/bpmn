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
 * @param {BPMNParseErrorQueue} errorQueue
 * @return {BPMNExclusiveGateway|BPMNParallelGateway}
 */
exports.createBPMNGateway = function(node, errorQueue) {
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
        errorQueue.addError("UnsupportedGateway", {bpmnId: id, name: name, type: node.local}, "The gateway '" + name + "' is not supported yet.");
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

    outgoingSequenceFlows.forEach(function(outgoingSequenceFlow) {
        if (emittedToken) return;

        if (isDiverging) {
            var handlerName = self.name + handlerModule.handlerNameSeparator + outgoingSequenceFlow.name;
            if (handlerModule.callHandler(handlerName, process, data)) {
                process.emitTokenAlong(self, outgoingSequenceFlow, data);
                emittedToken = true;
            }
        } else {
            process.emitTokenAlong(self, outgoingSequenceFlow, data);
            emittedToken = true;
        }
    });
};

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNExclusiveGateway.prototype.validate = function(processDefinition, errorQueue) {
    var self = this;

    this.assertName(errorQueue);
    assertGatewayFlowCardinality(this, processDefinition, errorQueue);

    var outgoingSequenceFlows = processDefinition.getOutgoingSequenceFlows(this);
    outgoingSequenceFlows.forEach(function(outgoingSequenceFlow) {
        var name = outgoingSequenceFlow.name;
        if (!name || name.trim() === '') {
            errorQueue.addError("XG1", outgoingSequenceFlow, "Outgoing flows of the " + self.type + " '" + self.name + "' must have names.");
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
    var self = this;
    var state = process.state;

    state.createTokenAt(self.name, process.processId);

    var numberOfIncomingFlows = process.processDefinition.getIncomingSequenceFlows(self).length;
    var numberOfTokens = state.numberOfTokensAt(self);
    if (numberOfTokens === numberOfIncomingFlows) {
        state.removeAllTokensAt(self);
        var outgoingSequenceFlows = process.processDefinition.getOutgoingSequenceFlows(self);
        outgoingSequenceFlows.forEach(function(outgoingSequenceFlow){
            process.emitTokenAlong(self, outgoingSequenceFlow, data);
        });
    }
};

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNParallelGateway.prototype.validate = function(processDefinition, errorQueue) {
    assertGatewayFlowCardinality(this, processDefinition, errorQueue);
};

/**
 * @param {BPMNParallelGateway | BPMNExclusiveGateway} gateway
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
function assertGatewayFlowCardinality(gateway, processDefinition, errorQueue) {
    gateway.assertIncomingSequenceFlows(processDefinition, errorQueue);
    gateway.assertOutgoingSequenceFlows(processDefinition, errorQueue);

    if (!errorQueue.hasErrors()) {
        var outgoingSequenceFlows = processDefinition.getOutgoingSequenceFlows(gateway);
        var incomingSequenceFlows = processDefinition.getIncomingSequenceFlows(gateway);

        var isDiverging = outgoingSequenceFlows.length > 1;
        var isConverging = incomingSequenceFlows.length > 1;
        if (!isDiverging && !isConverging) {
            errorQueue.addError("GW1", gateway, "The " + gateway.type + " '" + gateway.name + "' must have more than one incoming or outgoing flow to work as gateway.");
        }
    }
}