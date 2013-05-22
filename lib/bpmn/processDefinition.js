/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var parserUtilsModule = require("./parserUtils");
var bpmnParserModule = require("./parser.js");

/**
 * @param flowObject
 * @return {BPMNProcessDefinition}
 */
exports.createBPMNProcessDefinition = function(flowObject) {
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
    this.sequenceFlowBySourceIndex = null;
    this.sequenceFlowByTargetIndex = null;
    this.boundaryEventsByAttachmentIndex = null;
    this.nameMap = null;
    this.isProcessDefinition = true;
    /** {Array.<BPMNParticipant>} */
    this.collaboratingParticipants = [];
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
    return this.getProcessElement(bpmnId);
};

/**
 * @return {Array.<BPMNStartEvent>}
 */
BPMNProcessDefinition.prototype.getStartEvents = function() {
    return this.flowObjects.filter(function(flowObject) {
        return (flowObject.isStartEvent);
    });
};

/**
 * @return {Array.<BPMNActivity>}
 */
BPMNProcessDefinition.prototype.getBoundaryEvents = function() {
    return this.flowObjects.filter(function(flowObject) {
        return (flowObject.isBoundaryEvent);
    });
};

/**
 * @param {BPMNActivity} activity
 * @return {Array.<BPMNActivity>}
 */
BPMNProcessDefinition.prototype.getBoundaryEventsAt = function(activity) {
    if (!this.boundaryEventsByAttachmentIndex) {
        this.boundaryEventsByAttachmentIndex = this.buildBoundaryEventsByAttachmentIndex();
    }
    return (this.boundaryEventsByAttachmentIndex[activity.bpmnId] || []);
};

/**
 */
BPMNProcessDefinition.prototype.buildBoundaryEventsByAttachmentIndex = function() {
    var index = {};
    var self = this;

    var boundaryEvents = this.getBoundaryEvents();
    boundaryEvents.forEach(function(boundaryEvent) {
        var attachedToRef = boundaryEvent.attachedToRef;
        var activity = self.getFlowObject(attachedToRef);
        if (activity) {
            if (activity.isWaitTask) {
                var entry = index[attachedToRef];
                if (entry) {
                    entry.push(boundaryEvent);
                } else {
                    index[attachedToRef] = [boundaryEvent];
                }
            } else {
                // TODO: test
                throw Error("The activity '" + activity.name + "' has a boundary event but this is allowed only for wait tasks such as user or receive tasks.");
            }
        } else {
            // TODO: test
            throw Error("Cannot find the activity the boundary event '" + boundaryEvent.name +
                "' is attached to (activity BPMN ID: '" + boundaryEvent.attachedToRef + "'.");
        }
    });

    return index;
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
    var outgoingSequenceFlows = this.getOutgoingSequenceFlows(flowObject);
    outgoingSequenceFlows.forEach(function(flow){
        nextFlowObjects.push(self.getProcessElement(flow.targetRef));
    });
    return nextFlowObjects;
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Array.<BPMNSequenceFlow>}
 */
BPMNProcessDefinition.prototype.getOutgoingSequenceFlows = function(flowObject) {
    if (!this.sequenceFlowBySourceIndex) {
        this.sequenceFlowBySourceIndex = this.buildSequenceFlowIndex(true);
    }
    return (this.sequenceFlowBySourceIndex[flowObject.bpmnId] || []);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Array.<BPMNSequenceFlow>}
 */
BPMNProcessDefinition.prototype.getIncomingSequenceFlows = function(flowObject) {
    if (!this.sequenceFlowByTargetIndex) {
        this.sequenceFlowByTargetIndex = this.buildSequenceFlowIndex(false);
    }
    return (this.sequenceFlowByTargetIndex[flowObject.bpmnId] || []);
};

/**
 * @param {BPMNFlowObject} flowObject
 */
BPMNProcessDefinition.prototype.addFlowObject = function(flowObject) {
    this.processElementIndex = null;
    this.nameMap = null;
    this.boundaryEventsByAttachmentIndex = null;
    this.flowObjects.push(flowObject);
};

/**
 * @param {BPMNSequenceFlow} sequenceFlow
 */
BPMNProcessDefinition.prototype.addSequenceFlow = function(sequenceFlow) {
    this.sequenceFlowBySourceIndex = null;
    this.sequenceFlowByTargetIndex = null;
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
 * @param {Boolean} indexBySource If false or undefined, we index by target.
 * @return {Object}
 */
BPMNProcessDefinition.prototype.buildSequenceFlowIndex = function(indexBySource) {
    var index = {};
    this.sequenceFlows.forEach(function(sequenceFlow) {
        var ref = indexBySource ? sequenceFlow.sourceRef : sequenceFlow.targetRef;
        var entry = index[ref];
        if (entry) {
            entry.push(sequenceFlow);
        } else {
            index[ref] = [sequenceFlow];
        }
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

/**
 * @param {String} participantName
 * @return {<BPMNParticipant>}
 */
BPMNProcessDefinition.prototype.getParticipantByName = function(participantName) {
    var participants = this.collaboratingParticipants.filter(function(participant) {
        return (participant.name === participantName);
    });

    if (participants.length > 1) {
        throw Error("There is more than one collaboration participant having the same name: '" + participantName + "'");
    }

    return participants[0];
};

/**
 * @return {Array.<BPMNParticipant>}
 */
BPMNProcessDefinition.prototype.getCollaboratingParticipants = function() {
    return this.collaboratingParticipants;
};

/**
 * @param {Array.<BPMNParticipant>} participants
 */
BPMNProcessDefinition.prototype.addCollaboratingParticipants = function(participants) {
    var self = this;
    participants.forEach(function(participant) {
        if (!self.getParticipantByName(participant.name)) {
            self.collaboratingParticipants.push(participant);
        }
    });
 };