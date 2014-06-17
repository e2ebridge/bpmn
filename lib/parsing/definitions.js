/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var fs = require('fs');
var path = require('path');
var fileUtils = require('../utils/file.js');
var utils = require('../utils/utils.js');
var parser = require("./parser.js");
var errors = require("./errors.js");

var bpmnDefinitionsCache = {};
exports.clearCache = function() {
    bpmnDefinitionsCache = {};
};

/**
 * @param bpmnFilePath
 * @return {BPMNProcessDefinition}
 */
exports.getBPMNProcessDefinition = function(bpmnFilePath) {
    var processDefinition;
    var processDefinitions = getBPMNProcessDefinitions(bpmnFilePath);

    if (processDefinitions.length === 1) {
        processDefinition = processDefinitions[0];
    } else {
        throw new Error("The BPMN file '" + bpmnFilePath + "'. contains more than one process definition. Use 'getBPMNProcessDefinitions' instead of 'getBPMNProcessDefinition'");
    }
    return processDefinition;
};

/**
 * @param bpmnFilePath
 * @return {Array.<BPMNProcessDefinition>}
 */
var getBPMNProcessDefinitions = exports.getBPMNProcessDefinitions = function(bpmnFilePath) {
    var bpmnDefinitions = getCachedBPMNDefinitions(bpmnFilePath);
    return getProcessDefinitions(bpmnDefinitions);
};

/**
 * @param bpmnFilePath
 * @return {Array.<BPMNCollaborationDefinition>}
 */
exports.getBPMNCollaborationDefinitions = function(bpmnFilePath) {
    var bpmnDefinitions = getCachedBPMNDefinitions(bpmnFilePath);
    return getCollaborationDefinitions(bpmnDefinitions);
};

function getCollaborationDefinitions(bpmnDefinitions) {
    return bpmnDefinitions.filter(function(definition) {
        return definition.isCollaborationDefinition;
    });
}

function getProcessDefinitions(bpmnDefinitions) {
    return bpmnDefinitions.filter(function(definition) {
        return definition.isProcessDefinition;
    });
}

/**
 * We don't read bpmn files asynchronously (like node is loading js-files also synchronously),
 * thus we have to cache the definitions.
 * @param {String} bpmnFilePath
 * @return {Array.<BPMNProcessDefinition|BPMNCollaborationDefinition>}
 */
function getCachedBPMNDefinitions(bpmnFilePath) {
    var bpmnDefinitions = bpmnDefinitionsCache[bpmnFilePath];

    if (!bpmnDefinitions) {
        bpmnDefinitions = getBPMNDefinitions(bpmnFilePath);
        bpmnDefinitionsCache[bpmnFilePath] = bpmnDefinitions;
    }

    return bpmnDefinitions;
}
exports.getCachedBPMNDefinitions = getCachedBPMNDefinitions;

/**
 *
 * @param bpmnDefinitions
 */
function setCollaborationDefinitions(bpmnDefinitions){
    var collaborationDefinitions = getCollaborationDefinitions(bpmnDefinitions);
    var processDefinitions = getProcessDefinitions(bpmnDefinitions);
    var errorQueue = errors.createBPMNParseErrorQueue();
    processDefinitions.forEach(function(processDefinition) {
        processDefinition.validate(errorQueue);
        errorQueue.check();
        processDefinition.attachCollaborationDefinitions(collaborationDefinitions);
    });
}

/**
 * @param {String} bpmnFilePath
 * @return {Array.<BPMNProcessDefinition|BPMNCollaborationDefinition>}
 */
function getBPMNDefinitions(bpmnFilePath) {
    var errorQueue = errors.createBPMNParseErrorQueue();
    var bpmnDefinitions, bpmnXML;

    try {
        bpmnXML = fs.readFileSync(bpmnFilePath, "utf8");
        bpmnDefinitions = parser.parse(bpmnXML, errorQueue, utils.toUpperCamelCase(fileUtils.removeFileExtension(path.basename(bpmnFilePath))), bpmnFilePath);
    } catch (e) {
        errorQueue.addError("DF1", null, "Could not parse the BPMN file '" + bpmnFilePath + "'. Error: '" + e + "'");
    }

    errorQueue.check();

    setCollaborationDefinitions(bpmnDefinitions);

    return bpmnDefinitions;
}
exports.getBPMNDefinitions = getBPMNDefinitions;


/**
 * @param {String} bpmnXML
 * @param {String=} mainProcessName
 * @param {String=} bpmnFilePath
 * @return {Array.<BPMNProcessDefinition|BPMNCollaborationDefinition>}
 */
function getBPMNDefinitionsFromXML(bpmnXML, mainProcessName, bpmnFilePath) {
    var errorQueue = errors.createBPMNParseErrorQueue();
    var bpmnDefinitions;

    try {
        bpmnDefinitions = parser.parse(bpmnXML, errorQueue, mainProcessName, bpmnFilePath);
    } catch (e) {
        errorQueue.addError("DF1", null, "Could not parse the BPMN XML string'. Error: '" + e + "'");
    }

    errorQueue.check();

    setCollaborationDefinitions(bpmnDefinitions);

    return bpmnDefinitions;
}
exports.getBPMNDefinitionsFromXML = getBPMNDefinitionsFromXML;
