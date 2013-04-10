/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var nodeUtilsModule = require('util');
var parserUtilsModule = require("./parserUtils");
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;


/**
 * @param node
 * @constructor
 */
exports.createBPMNTask = function(node) {
    var getValue = parserUtilsModule.getAttributesValue;
    return (new BPMNTask(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isTaskName = function(localName) {
    return (localName.toLowerCase().indexOf("task") > -1);
};

nodeUtilsModule.inherits(BPMNTask, BPMNFlowObject);
/**
 * Subsumes all kind of tasks
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {Array.<String>=} incomingRefs
 * @param {Array.<String>=} outgoingRefs
 * @constructor
 */
function BPMNTask(bpmnId, name, type, incomingRefs, outgoingRefs) {
    BPMNFlowObject.call(this, bpmnId, name, type, incomingRefs, outgoingRefs);
    this.waitForTaskDoneEvent = type == 'task' || type == 'userTask';
}
exports.BPMNTask = BPMNTask;
