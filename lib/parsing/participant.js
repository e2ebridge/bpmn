/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var parserUtils = require("./parserUtils");

/**
 * @param node
 * @constructor
 */
exports.createBPMNParticipant = function(node) {
    var getValue = parserUtils.getAttributesValue;
    return (new BPMNParticipant(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local,
        getValue(node, "processRef")
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isParticipantName = function(localName) {
    return (localName === 'participant');
};

/**
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {String} processRef
 * @constructor
 */
var BPMNParticipant = exports.BPMNParticipant = function(bpmnId, name, type, processRef) {
    this.bpmnId = bpmnId;
    this.name = name;
    this.type = type;
    this.processRef = processRef;
};
