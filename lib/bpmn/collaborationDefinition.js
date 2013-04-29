/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var parserUtilsModule = require("./parserUtils");

/**
 * @param node
 * @return {BPMNCollaborationDefinition}
 */
exports.createBPMNCollaborationDefinition = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
    return (new BPMNCollaborationDefinition(getValue(node, "id")));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isCollaborationDefinitionName = function(localName) {
    return (localName === "collaboration");
};

/**
 * @param {String} bpmnId
 * @constructor
 */
function BPMNCollaborationDefinition(bpmnId) {
    this.bpmnId = bpmnId;
    this.participants = [];
    this.messageFlows = [];
    this.isCollaborationDefinition = true;
}

/**
 * @param {BPMNParticipant} participant
 */
BPMNCollaborationDefinition.prototype.addParticipant = function(participant) {
   this.participants.push(participant);
};

/**
 * @param {String} processBbpmnId
 * @return {BPMNParticipant}
 */
BPMNCollaborationDefinition.prototype.getParticipantByProcessId = function(processBbpmnId) {
    var participants = this.participants.filter(function(participant) {
        return (participant.processRef === processBbpmnId);
    });
    if (participants.length > 1) {
        throw Error("Cannot uniquely assign a pool to the process whith the BPMN ID '" + processBbpmnId + "'")
    }
    return participants[0];
};

/**
 * Get all participants the process is collaborating with
 * @param {String} processBbpmnId
 * @return {Array.<BPMNParticipant>}
 */
BPMNCollaborationDefinition.prototype.getCollaboratingParticipants = function(processBbpmnId) {
    return this.participants.filter(function(participant) {
        return (participant.processRef !== processBbpmnId);
    });
};

/**
 * @param {BPMNMessageFlow} messageFlow
 */
BPMNCollaborationDefinition.prototype.addMessageFlow = function(messageFlow) {
    this.messageFlows.push(messageFlow);
};

exports.BPMNCollaborationDefinition = BPMNCollaborationDefinition;
