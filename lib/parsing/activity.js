/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var util = require('util');
var BPMNFlowObject = require("./flowObject.js").BPMNFlowObject;

exports.activityEndHandlerPostfix = "Done";
/**
 * Subsumes all kind of tasks
 * @param {String} bpmnId
 * @param {String} name
 * @param {String} type
 * @constructor
 */
var BPMNActivity = exports.BPMNActivity = function(bpmnId, name, type) {
    BPMNFlowObject.call(this, bpmnId, name, type);
    this.isActivity = true;
};
util.inherits(BPMNActivity, BPMNFlowObject);
