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
    this.isCollaboration = true;
}

/**
 * @param {BPMNParticipant} participant
 */
BPMNCollaborationDefinition.prototype.addParticipant = function(participant) {
   this.participants.push(participant);
};

/**
 * @param {BPMNMessageFlow} messageFlow
 */
BPMNCollaborationDefinition.prototype.addMessageFlow = function(messageFlow) {
    this.messageFlows.push(messageFlow);
};

exports.BPMNCollaborationDefinition = BPMNCollaborationDefinition;
