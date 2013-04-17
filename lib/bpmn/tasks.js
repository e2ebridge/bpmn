/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var nodeUtilsModule = require('util');
var parserUtilsModule = require("./parserUtils");
var BPMNActivity = require("./activity.js").BPMNActivity;


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

nodeUtilsModule.inherits(BPMNTask, BPMNActivity);
/**
 * Subsumes all kind of tasks
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
function BPMNTask(bpmnId, name, type) {
    BPMNActivity.call(this, bpmnId, name, type);
    this.isWaitActivity = type == 'task' || type == 'userTask' || type == 'receiveTask';
}
exports.BPMNTask = BPMNTask;

