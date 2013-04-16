/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var nodeUtilsModule = require('util');
var parserUtilsModule = require("./parserUtils");
var BPMNActivity = require("./activity.js").BPMNActivity;

/**
 * @param node
 * @param {Object} prefix2NamespaceMap
 * @param {Object} importNamespace2LocationMap
 * @constructor
 */
exports.createBPMNCallActivity = function(node, prefix2NamespaceMap, importNamespace2LocationMap) {
    var getValue = parserUtilsModule.getAttributesValue;
    var calledElement = getValue(node, "calledElement");
    var splitName = parserUtilsModule.splitPrefixedName(calledElement);
    var calledElementNamespace = prefix2NamespaceMap[splitName.prefix];
    return (new BPMNCallActivity(
        getValue(node, "id"),
        getValue(node, "name"),
        node.local,
        splitName.localName,
        calledElementNamespace,
        importNamespace2LocationMap[calledElementNamespace]
    ));
};

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isCallActivityName = function(localName) {
    return (localName.toLowerCase().indexOf("call") > -1);
};

/**
 * Subsumes all kind of tasks
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @param {String} calledElementName
 * @param {String} calledElementNamespace
 * @param {String} location
 * @constructor
 */
function BPMNCallActivity(bpmnId, name, type, calledElementName, calledElementNamespace, location) {
    BPMNActivity.call(this, bpmnId, name, type);
    this.isCallActivity = true;
    this.calledElementName = calledElementName;
    this.calledElementNamespace = calledElementNamespace;
    this.location = location;
}
exports.BPMNCallActivity = BPMNCallActivity;
nodeUtilsModule.inherits(BPMNCallActivity, BPMNActivity);


