/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var processCache = {};

exports.clear = function() {
    processCache = {};
};

/**
 * @param {String} processId
 */
exports.remove = function(processId) {
    delete processCache[processId];
};

/**
 * @param {String} processId
 * @returns {BPMNProcess}
 */
var get = exports.get = function get(processId) {
    return processCache[processId];
};

/**
 * @param {String} processId
 * @param {BPMNProcess} bpmnProcess
 */
exports.set = function(processId, bpmnProcess) {
    processCache[processId] = bpmnProcess;
};

/**
 * @returns {Array.<BPMNProcessClient>}
 */
function getAllLoadedProcesses() {
    var allLoadedProcessIds = Object.keys(processCache);
    return allLoadedProcessIds.map(function(loadedProcessId) {
        return get(loadedProcessId);
    });
}

/**
 * @param {Object} query The query is an object that is being matched to the data.
 * @param {Array.<BPMNProcess | BPMNProcessClient>=} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcess | BPMNProcessClient>}
 */
exports.findByProperty = function(query, bpmnProcesses) {
    var foundProcesses = [];
    var queryFields = query ? Object.getOwnPropertyNames(query) : [];
    var findAll = !query;

    bpmnProcesses = bpmnProcesses || getAllLoadedProcesses();
    bpmnProcesses.forEach(function(bpmnProcess) {
        if (findAll || hasMatchingProperties(bpmnProcess.getProperties(), queryFields, query)) {
            foundProcesses.push(bpmnProcess.processClient || bpmnProcess);
        }
    });
    return foundProcesses;
};

/**
 * @param {Object} processData
 * @param {Array.<Object>} queryFields
 * @param {Array.<String|Number|Boolean|Date>} queryValues
 * @returns {Boolean}
 */
var hasMatchingProperties =  exports.hasMatchingProperties = function(processData, queryFields, queryValues) {
    var isMatching = true;
    queryFields.forEach(function (queryField){
        if (isMatching) {  // AND semantics: if it is false once, it stays false
            isMatching = hasMatchingProperty(processData, queryField, queryValues[queryField]);
        }
     });
    return isMatching;
};

/**
 *
 * @param {Object} processData
 * @param {String} propertyName
 * @param {String|Number|Boolean|Date} queryValue
 * @returns {Boolean}
 */
var hasMatchingProperty = exports.hasMatchingProperty = function(processData, propertyName, queryValue) {
    var isMatching = false;
    if (processData) {
        var separatorIndex = propertyName ? propertyName.indexOf('.') : -1;
        if (separatorIndex > -1) {
            var parent = propertyName.substring(0, separatorIndex);
            var rest = propertyName.substring(separatorIndex + 1);
            isMatching = hasMatchingProperty(processData[parent], rest, queryValue);
        } else {
            if(processData.hasOwnProperty(propertyName)) {
                if (processData[propertyName] === queryValue) {
                    isMatching = true;
                }
            }
        }
    }

    return isMatching;
};

/**
 * Returns all processes where the current task, activity, or event name equals the given state name
 * @param {String} stateName.
 * @param {Array.<BPMNProcess | BPMNProcessClient>=} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcess | BPMNProcessClient>}
 */
exports.findByState = function(stateName, bpmnProcesses) {
    var foundProcesses = [];
    var findAll = !stateName;

    bpmnProcesses = bpmnProcesses || getAllLoadedProcesses();
    bpmnProcesses.forEach(function(bpmnProcess) {
        if (findAll || bpmnProcess.getState().hasTokens(stateName)) {
            foundProcesses.push(bpmnProcess.processClient || bpmnProcess);
        }
    });
    return foundProcesses;
};

/**
 * @param {String} processName.
 * @param {Boolean=} caseSensitive
 * @param {Array.<BPMNProcess | BPMNProcessClient>=} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcess | BPMNProcessClient>}
 */
exports.findByName  = function(processName, caseSensitive, bpmnProcesses) {
    var foundProcesses = [];

    if (processName) {
        var compare = function(a, b) {
            var result;
            if (caseSensitive === undefined || caseSensitive) {
                result = (a === b);
            } else {
                result = (a.toLowerCase() === b.toLowerCase());
            }
            return result;
        };

        bpmnProcesses = bpmnProcesses || getAllLoadedProcesses();
        bpmnProcesses.forEach(function(bpmnProcess) {
            var name = bpmnProcess.processDefinition.name;
            if (compare(name, processName)) {
                foundProcesses.push(bpmnProcess.processClient || bpmnProcess);
            }
        });
    }
    return foundProcesses;
};