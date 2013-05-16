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
 * @param {Function=} removeFromCache
 */
BPMNEndEvent.prototype.emitTokens = function(currentProcess, data, removeFromCache) {
    var parentProcess = currentProcess.parentProcess;
    if (parentProcess) {
        var currentCallActivityName = currentProcess.parentToken.position;
        parentProcess.emitActivityFinishedEvent(currentCallActivityName, data);
    } else {
        // no parent implies we finish the main process
        removeFromCache(currentProcess.processId);
    }
};
