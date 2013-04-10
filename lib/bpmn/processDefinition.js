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

    /*
     * We map most bpmn elements of a simpler bpmn subset being easily supported by the bridge
     */
    /** @type {Array.<BPMNTask>} */
    this.tasks = [];
    /** @type {Array.<BPMNStartEvent>} */
    this.startEvents = [];
    /** @type {Array.<BPMNEndEvent>} */
    this.endEvents = [];
    /** @type {Array.<BPMNSequenceFlow>} */
    this.sequenceFlows = [];
    /** @type {Array.<BPMNExclusiveGateway>} */
    this.gateways = [];

    this.processElementIndex = null;
    this.nameMap = null;
}
exports.BPMNProcessDefinition = BPMNProcessDefinition;

/**
 * @param {String} bpmnId
 * @return {BPMNFlowObject}
 */
BPMNProcessDefinition.prototype.getProcessElement = function(bpmnId) {
    if (!(this.processElementIndex)) {
        this.processElementIndex = this.buildIndex();
    }
    return this.processElementIndex[bpmnId];
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
 * @param {Array.<BPMNFlowObject>} flowObjects
 * @param {BPMNFlowObject} flowObject
 */
function addFlowObject(flowObjects, flowObject) {
    this.processElementIndex = null;
    this.nameMap = null;
    flowObjects.push(flowObject);
}

/**
 * @param {BPMNTask} task
 */
BPMNProcessDefinition.prototype.addTask = function(task) {
    addFlowObject(this.tasks, task);
};

/**
 * @param {BPMNStartEvent} startEvent
 */
BPMNProcessDefinition.prototype.addStartEvent = function(startEvent) {
    addFlowObject(this.startEvents, startEvent);
};

/**
 * @return {Array.<BPMNStartEvent>}
 */
BPMNProcessDefinition.prototype.getStartEvents = function() {
    return this.startEvents;
};

/**
 * @param {BPMNEndEvent} endEvent
 */
BPMNProcessDefinition.prototype.addEndEvent = function(endEvent) {
    addFlowObject(this.endEvents, endEvent);
};

/**
 * @param {BPMNExclusiveGateway|BPMNParallelGateway} gateway
 */
BPMNProcessDefinition.prototype.addGateway = function(gateway) {
    addFlowObject(this.gateways, gateway);
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
    return (this.tasks
        .concat(this.startEvents)
        .concat(this.endEvents)
        .concat(this.gateways)
     );
};

/**
 * Process Elements = Flow objects + connection objects + artifacts
 * Semantics of these names is described in http://de.wikipedia.org/wiki/Business_Process_Model_and_Notation#Notation
 * @return {Array.<Object>}
 */
BPMNProcessDefinition.prototype.getProcessElements = function() {
    var flowObjects = this.getFlowObjects();
    return (flowObjects
        .concat(this.sequenceFlows)
        );
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
