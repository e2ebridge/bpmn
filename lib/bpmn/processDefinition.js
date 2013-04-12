/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var parserUtilsModule = require("./parserUtils");

/**
 * @param flowObject
 * @return {BPMNProcessDefinition}
 */
exports.getBPMNProcess = function(flowObject) {
    var getValue = parserUtilsModule.getAttributesValue;

    return (new BPMNProcessDefinition(
        getValue(flowObject, "id"),
        getValue(flowObject, "name")
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isProcessName = function(localName) {
    return (localName === 'process');
};

/**
 * @param {String} bpmnId
 * @param {String} name
 * @constructor
 */
function BPMNProcessDefinition(bpmnId, name) {
    this.bpmnId = bpmnId;
    this.name = name;
    this.flowObjects = [];
    this.sequenceFlows = [];

    // Process Elements = Flow objects + connection objects + artifacts
    // Semantics of these names is described in http://de.wikipedia.org/wiki/Business_Process_Model_and_Notation#Notation
    this.processElementIndex = null;
    this.nameMap = null;
}
exports.BPMNProcessDefinition = BPMNProcessDefinition;

/**
 * @param {String} bpmnId
 * @return {*}
 */
BPMNProcessDefinition.prototype.getProcessElement = function(bpmnId) {
    if (!(this.processElementIndex)) {
        this.processElementIndex = this.buildIndex();
    }
    return this.processElementIndex[bpmnId];
};

/**
 * @param {String} bpmnId
 * @return {BPMNFlowObject}
 */
BPMNProcessDefinition.prototype.getFlowObject = function(bpmnId) {
    var element = this.getProcessElement(bpmnId);
    if (!element || !element.isFlowObject) {
        throw Error("getFlowObject: the process element '" + bpmnId + "' is not a flow object.");
    }
    return element;
};

/**
 * @param {String} name
 * @return {BPMNFlowObject}
 */
BPMNProcessDefinition.prototype.getFlowObjectByName = function(name) {
    var bpmnId = this.getIdByName(name);
    return this.getFlowObject(bpmnId);
};


/**
 * @param {String} name
 * @return {String}
 */
BPMNProcessDefinition.prototype.getIdByName = function(name) {
    if (!(this.nameMap)) {
        this.nameMap = this.buildNameMap();
    }
    return this.nameMap[name];
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Array.<BPMNFlowObject>}
 */
BPMNProcessDefinition.prototype.getNextFlowObjects = function(flowObject) {
    var nextFlowObjects = [];
    var self = this;
    var outgoingFlows = [];
    flowObject.outgoingRefs.forEach(function(outgoingRef){
        outgoingFlows.push(self.getProcessElement(outgoingRef));
    });
    outgoingFlows.forEach(function(flow){
        nextFlowObjects.push(self.getProcessElement(flow.targetRef));
    });
    return nextFlowObjects;
};

/**
 * @param {String} outgoingRef
 * @return {BPMNSequenceFlow}
 */
BPMNProcessDefinition.prototype.getOutgoingSequenceFlow = function(outgoingRef) {
    var element = this.getProcessElement(outgoingRef);
    if (!element) {
        throw new Error("Cannot find sequence flow '" + outgoingRef + "'");
    }
    if (!element.isSequenceFlow ) {
        throw new Error("The process element '" + outgoingRef + "' is not a sequence flow.");
    }
    return element;
};

/**
 * @param {BPMNFlowObject} flowObject
 */
BPMNProcessDefinition.prototype.addFlowObject = function(flowObject) {
    this.processElementIndex = null;
    this.nameMap = null;
    this.flowObjects.push(flowObject);
};

/**
 * @param {BPMNSequenceFlow} sequenceFlow
 */
BPMNProcessDefinition.prototype.addSequenceFlow = function(sequenceFlow) {
    this.sequenceFlows.push(sequenceFlow);
};

/**
 * @return {Array.<BPMNFlowObject>}
 */
BPMNProcessDefinition.prototype.getFlowObjects = function() {
    return this.flowObjects;
};

/**
 * @return {Array.<Object>}
 */
BPMNProcessDefinition.prototype.getProcessElements = function() {
    var flowObjects = this.getFlowObjects();
    return (flowObjects.concat(this.sequenceFlows));
};

/**
 * @return {Object}
 */
BPMNProcessDefinition.prototype.buildIndex = function() {
    var index = {};
    var processElements = this.getProcessElements();
    processElements.forEach(function(processElement) {
        index[processElement.bpmnId] = processElement;
    });
    return index;
};

/**
 * @return {Object}
 */
BPMNProcessDefinition.prototype.buildNameMap = function() {
    var map = {};
    var flowObjects = this.getFlowObjects();
    flowObjects.forEach(function(flowObject) {
        var name = flowObject.name;
        if (map[name]) {
            throw new Error("Process element name '" + name + "' must be unique.");
        } else {
            map[name] = flowObject.bpmnId;
        }
    });
    return map;
};
