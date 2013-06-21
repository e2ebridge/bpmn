/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var util = require('util');
var parserUtilsModule = require("./parserUtils.js");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

/**
 * @param node
 * @return {BPMNEndEvent}
 */
exports.createBPMNEndEvent = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
    return (new BPMNEndEvent(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isEndEventName = function(localName) {
    return (localName.toLowerCase().indexOf("end") > -1);
};

/**
 * Subsumes all kind of end events
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
function BPMNEndEvent(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isEndEvent = true;
}
util.inherits(BPMNEndEvent, BPMNFlowObject);
exports.BPMNEndEvent = BPMNEndEvent;

/**
 * Semantics: emit token to the parent process - if there is one. Otherwise we are at the end
 *          of the main process and thus delete it from the cache.
 * @param {BPMNProcess} currentProcess
 * @param {Object} data
 */
BPMNEndEvent.prototype.emitTokens = function(currentProcess, data) {
    var endEventName = this.name;
    currentProcess.onFlowObjectEnd(endEventName, data, function() {
        var parentProcess = currentProcess.parentProcess;
        if (parentProcess) {
            var currentCallActivityName = currentProcess.parentToken.position;
            currentProcess.onProcessEnd(endEventName);
            parentProcess.emitActivityEndEvent(currentCallActivityName, data);
        } else {
            currentProcess.onProcessEnd(endEventName, true);
        }
    });
};

/**
 * @param {BPMNProcessDefinition} processDefinition
 * @param {BPMNParseErrorQueue} errorQueue
 */
BPMNEndEvent.prototype.validate = function(processDefinition, errorQueue) {
    this.assertName(errorQueue);
    this.assertIncomingSequenceFlows(processDefinition, errorQueue);
    this.assertNoOutgoingSequenceFlows(processDefinition, errorQueue);
};