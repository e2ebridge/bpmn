/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var util = require('util');
var handler = require('../handler.js');
var parserUtils = require("./parserUtils");
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
    var getAttributeValue = parserUtils.getAttributesValue;
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
var isExclusiveGatewayName = function(localName) {
    return (localName === "exclusiveGateway");
};

/**
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
var BPMNExclusiveGateway = exports.BPMNExclusiveGateway = function(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isExclusiveGateway = true;
};
util.inherits(BPMNExclusiveGateway, BPMNFlowObject);

/**
 * Semantics: emit token along the first outgoing flow having an event handler that evaluates to true
 * @param {BPMNProcess} currentProcess
 * @param {Object} data
 */
BPMNExclusiveGateway.prototype.emitTokens = function(currentProcess, data) {
    var self = this;
    var emittedToken = false;
    var outgoingSequenceFlows = currentProcess.processDefinition.getOutgoingSequenceFlows(self);
    var isDiverging = outgoingSequenceFlows.length > 1;
    var handlerName;

    currentProcess.onFlowObjectEnd(self.name, data, function() {
        outgoingSequenceFlows.forEach(function(outgoingSequenceFlow) {
            if (emittedToken) {
                return;
            }

            if (isDiverging) {
                handlerName = self.name + handler.handlerNameSeparator + outgoingSequenceFlow.name;
                if (handler.callHandler(handlerName, currentProcess, data)) {
                    if(currentProcess.getCurrentTrx()){
                        currentProcess.getCurrentTrx().processChoice(currentProcess.processDefinition.name, currentProcess.getProcessId(), self.name, outgoingSequenceFlow.name);
                        currentProcess.getCurrentTrx().end();
                    }
                    currentProcess.emitTokenAlong(self, outgoingSequenceFlow, data);
                    emittedToken = true;
                }
            } else {
                if(currentProcess.getCurrentTrx()){
                    currentProcess.getCurrentTrx().end();
                }
                currentProcess.emitTokenAlong(self, outgoingSequenceFlow, data);
                emittedToken = true;
            }
        });
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
            errorQueue.addError("XG1", outgoingSequenceFlow,
                "Outgoing flows of the " + self.type + " '" + self.name + "' must have names.");
        }
    });
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
var isParallelGatewayName = function(localName) {
    return (localName === "parallelGateway");
};

/**
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
var BPMNParallelGateway = exports.BPMNParallelGateway = function(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isParallelGateway = true;
};
util.inherits(BPMNParallelGateway, BPMNFlowObject);

/**
 * Semantics: wait until all tokens arrive and then emit tokens along all outgoing flows
 * @param {BPMNProcess} process
 * @param {Object} data
 */
BPMNParallelGateway.prototype.emitTokens = function(process, data) {
    var self = this;
    var state = process.state;
    var numberOfIncomingFlows = process.processDefinition.getIncomingSequenceFlows(self).length;
    var numberOfTokens;

    state.createTokenAt(self.name, process.processId);

    numberOfTokens = state.numberOfTokensAt(self);
    if (numberOfTokens === numberOfIncomingFlows) {
        process.onFlowObjectEnd(self.name, data, function() {
            state.removeAllTokensAt(self);
            var outgoingSequenceFlows = process.processDefinition.getOutgoingSequenceFlows(self);
            outgoingSequenceFlows.forEach(function(outgoingSequenceFlow){
                process.emitTokenAlong(self, outgoingSequenceFlow, data);
            });
       });
    } else {
        process.persist();
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
    var outgoingSequenceFlows, incomingSequenceFlows, isDiverging, isConverging;

    gateway.assertIncomingSequenceFlows(processDefinition, errorQueue);
    gateway.assertOutgoingSequenceFlows(processDefinition, errorQueue);

    if (!errorQueue.hasErrors()) {
        outgoingSequenceFlows = processDefinition.getOutgoingSequenceFlows(gateway);
        incomingSequenceFlows = processDefinition.getIncomingSequenceFlows(gateway);

        isDiverging = outgoingSequenceFlows.length > 1;
        isConverging = incomingSequenceFlows.length > 1;
        if (!isDiverging && !isConverging) {
            errorQueue.addError("GW1", gateway, "The " + gateway.type + " '" + gateway.name + "' must have more than one incoming or outgoing flow to work as gateway.");
        }
    }
}