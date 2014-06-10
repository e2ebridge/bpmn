/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

/**
 * @param {Object} query The query is an object that is being matched to the data.
 * @param {Array.<BPMNProcess | BPMNProcessClient>} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcessClient>}
 */
exports.findByProperty = function(bpmnProcesses, query) {
    var foundProcesses = [];
    var findAll = !query;

    bpmnProcesses.forEach(function(bpmnProcess) {
        if (findAll || hasMatchingProperties(bpmnProcess.getProperties(), query)) {
            foundProcesses.push(bpmnProcess.processClient || bpmnProcess);
        }
    });
    return foundProcesses;
};

/**
 * @param {Object} processData
 * @param {Object} query
 * @returns {Boolean}
 */
var hasMatchingProperties = function(processData, query) {
    var isMatching = true;
    var queryFields = query ? Object.getOwnPropertyNames(query) : [];

    queryFields.forEach(function (queryField){
        if (isMatching) {  // AND semantics: if it is false once, it stays false
            isMatching = hasMatchingProperty(processData, queryField, query[queryField]);
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
var hasMatchingProperty = function(processData, propertyName, queryValue) {
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
 * @param {Array.<BPMNProcess | BPMNProcessClient>} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcessClient>}
 */
exports.findByState = function(bpmnProcesses, stateName) {
    var foundProcesses = [];
    var findAll = !stateName;

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
 * @param {Array.<BPMNProcess | BPMNProcessClient>} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcessClient>}
 */
exports.findByName  = function(bpmnProcesses, processName, caseSensitive) {
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

        bpmnProcesses.forEach(function(bpmnProcess) {
            var name = bpmnProcess.getProcessDefinition().name;
            if (compare(name, processName)) {
                foundProcesses.push(bpmnProcess.processClient || bpmnProcess);
            }
        });
    }
    return foundProcesses;
};