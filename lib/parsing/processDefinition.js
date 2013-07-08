/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var parserUtils = require("./parserUtils");

/**
 * @param node
 * @param {DebuggerInterface=} debuggerInterface
 * @return {BPMNProcessDefinition}
 */
exports.createBPMNProcessDefinition = function(node, debuggerInterface) {
    var getValue = parserUtils.getAttributesValue;

    return (new BPMNProcessDefinition(
        getValue(node, "id"),
        getValue(node, "name"),
        debuggerInterface
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
 * @param node
 * @return {Boolean}
 */
exports.isExecutable = function(node) {
    var isExecutable = parserUtils.getAttributesValue(node, "isExecutable");
    return (!isExecutable || isExecutable === 'true');
};

/**
 * @param {String} bpmnId
 * @param {String} name
 * @param {DebuggerInterface=} debuggerInterface
 * @constructor
 */
var BPMNProcessDefinition = exports.BPMNProcessDefinition = function(bpmnId, name, debuggerInterface) {
    this.bpmnId = bpmnId;
    this.name = name;
    this.flowObjects = [];
    this.sequenceFlows = [];
    this.messageFlows = [];

    // Process Elements = Flow objects + connection objects + artifacts
    // Semantics of these names is described in http://de.wikipedia.org/wiki/Business_Process_Model_and_Notation#Notation
    this.processElementIndex = null;
    this.sequenceFlowBySourceIndex = null;
    this.sequenceFlowByTargetIndex = null;
    this.messageFlowBySourceIndex = null;
    this.messageFlowByTargetIndex = null;
    this.boundaryEventsByAttachmentIndex = null;
    this.nameMap = null;
    this.isProcessDefinition = true;
    /** {Array.<BPMNParticipant>} */
    this.collaboratingParticipants = [];

    if (debuggerInterface) {
        this.debuggerInterface = debuggerInterface;
    }
};

/**
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNProcessDefinition.prototype.validate = function(errorQueue) {
    var self = this;
    var processElements = this.getProcessElements();

    processElements.forEach(function(processElement) {
        if (processElement.validate && typeof processElement.validate === 'function') {
            processElement.validate(self, errorQueue);
        }
    });
};

/**
 * @param {String} bpmnId
 * @return {*}
 */
BPMNProcessDefinition.prototype.getProcessElement = function(bpmnId) {
    if (!(this.processElementIndex)) {
        this.processElementIndex = this._buildIndex();
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
 * @param {{sourceRef: String}} flow
 * @return {BPMNFlowObject}
 */
BPMNProcessDefinition.prototype.getSourceFlowObject = function(flow) {
    return this.getProcessElement(flow.sourceRef);
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
                throw new Error("The activity '" + activity.name + "' has a boundary event but this is allowed only for wait tasks such as user or receive tasks.");
            }
        } else {
             throw new Error("Cannot find the activity the boundary event '" + boundaryEvent.name +
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
        this.nameMap = buildNameMap(this.getFlowObjects());
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
BPMNProcessDefinition.prototype.getIncomingSequenceFlows = function(flowObject) {
    return this._getFlows("sequenceFlowByTargetIndex", "sequenceFlows", flowObject, false);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Boolean}
 */
BPMNProcessDefinition.prototype.hasIncomingSequenceFlows = function(flowObject) {
    var outgoingFlows = this.getIncomingSequenceFlows(flowObject);
    return (outgoingFlows.length > 0);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Array.<BPMNSequenceFlow>}
 */
BPMNProcessDefinition.prototype.getOutgoingSequenceFlows = function(flowObject) {
    return this._getFlows("sequenceFlowBySourceIndex", "sequenceFlows", flowObject, true);
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
 * @param {BPMNFlowObject} flowObject
 * @return {Boolean}
 */
BPMNProcessDefinition.prototype.hasOutgoingSequenceFlows = function(flowObject) {
    var outgoingFlows = this.getOutgoingSequenceFlows(flowObject);
    return (outgoingFlows.length > 0);
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
 * Attach the collaborations participants and message flows to the process definitions for easier access
 * @param {Array.<BPMNCollaborationDefinition>} collaborationDefinitions
 */
BPMNProcessDefinition.prototype.attachCollaborationDefinitions = function(collaborationDefinitions) {
    var self = this;

    collaborationDefinitions.forEach(function(collaborationDefinition) {
        var processParticipant = collaborationDefinition.getParticipantByProcessId(self.bpmnId);

        if (processParticipant) {
            self.name = processParticipant.name;
            var collaboratingParticipants = collaborationDefinition.getCollaboratingParticipants(self.bpmnId);
            self.addCollaboratingParticipants(collaboratingParticipants);
            var messageFlows = collaborationDefinition.getMessageFlows();
            self.addMessageFlows(messageFlows);
        }
    });
};

/**
 * @param {String} participantName
 * @return {BPMNParticipant}
 */
BPMNProcessDefinition.prototype.getParticipantByName = function(participantName) {
    var participants = this.collaboratingParticipants.filter(function(participant) {
        return (participant.name === participantName);
    });

    if (participants.length > 1) {
        throw new Error("There is more than one collaboration participant having the same name: '" + participantName + "'");
    }

    return participants[0];
};

/**
 * @param {String} processDefinitionId
 * @return {BPMNParticipant}
 */
BPMNProcessDefinition.prototype.getParticipantById = function(processDefinitionId) {
    var participants = this.collaboratingParticipants.filter(function(participant) {
        return (participant.processRef === processDefinitionId);
    });
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

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Array.<BPMNMessageFlow>}
 */
BPMNProcessDefinition.prototype.getIncomingMessageFlows = function(flowObject) {
    return this._getFlows("messageFlowByTargetIndex", "messageFlows", flowObject, false);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Array.<BPMNMessageFlow>}
 */
BPMNProcessDefinition.prototype.getOutgoingMessageFlows = function(flowObject) {
    return this._getFlows("messageFlowBySourceIndex", "messageFlows", flowObject, true);
};

/**
 * @param {String} flowObjectName
 * @return {Array.<BPMNMessageFlow>}
 */
BPMNProcessDefinition.prototype.getMessageFlowsBySourceName = function(flowObjectName) {
    var flowObject = this.getFlowObjectByName(flowObjectName);
    return this.getOutgoingMessageFlows(flowObject);
};

/**
 * @param {Array.<BPMNMessageFlow>} messageFlows
 */
BPMNProcessDefinition.prototype.addMessageFlows = function(messageFlows) {
    var self = this;

    messageFlows.forEach(function(messageFlow) {
        if (self.getProcessElement(messageFlow.targetRef)) {
            messageFlow.targetProcessDefinitionId = self.bpmnId;
            self.messageFlows.push(messageFlow);
        } else if (self.getProcessElement(messageFlow.sourceRef)) {
            messageFlow.sourceProcessDefinitionId = self.bpmnId;
            self.messageFlows.push(messageFlow);
        }
    });
};

/**
 * @return {Object}
 * @private
 */
BPMNProcessDefinition.prototype._buildIndex = function() {
    var index = {};
    var processElements = this.getProcessElements();

    processElements.forEach(function(processElement) {
        index[processElement.bpmnId] = processElement;
    });
    return index;
};

/**
 * @param {String} indexName
 * @param {String} flowContainerName
 * @param {BPMNFlowObject} flowObject
 * @param {Boolean} isOutgoingFlow
 * @returns {*|Array}
 * @private
 */
BPMNProcessDefinition.prototype._getFlows = function(indexName, flowContainerName, flowObject, isOutgoingFlow) {
    if (!this[indexName]) {
        this[indexName] = buildFlowIndex(this[flowContainerName], isOutgoingFlow);
    }
    return (this[indexName][flowObject.bpmnId] || []);
};

/**
 * @param {Boolean} indexBySource If false or undefined, we index by target.
 * @param {Array} flows
 * @return {Object}
 */
function buildFlowIndex(flows, indexBySource) {
    var index = {};

    flows.forEach(function(flow) {
        var ref = indexBySource ? flow.sourceRef : flow.targetRef;
        var entry = index[ref];

        if (entry) {
            entry.push(flow);
        } else {
            index[ref] = [flow];
        }
    });
    return index;
}

/**
 * @param {Array.<{name: string, bpmnId: string}>} objects
 * @return {Object}
 * @private
 */
function buildNameMap(objects) {
    var map = {};

    objects.forEach(function(object) {
        var name = object.name;

        if (map[name]) {
            throw new Error("Process element name '" + name + "' must be unique.");
        } else {
            map[name] = object.bpmnId;
        }
    });

    return map;
}
