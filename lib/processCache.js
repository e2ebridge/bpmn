/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var processCache = {};
function clear() {
    processCache = {};
}
exports.clear = clear;

/**
 * @param {String} processId
 */
function remove(processId) {
    delete processCache[processId];
}
exports.remove = remove;

/**
 * @param {String} processId
 * @returns {BPMNProcess}
 */
function get(processId) {
    return processCache[processId];
}
exports.get = get;

/**
 * @param {String} processId
 * @param {BPMNProcess} bpmnProcess
 */
function set(processId, bpmnProcess) {
    processCache[processId] = bpmnProcess;
}
exports.set = set;

function findByValue(queryFields, queryValues) {
    var allLoadedProcesses = Object.keys(processCache);
    return allLoadedProcesses.filter(function(loadedProcess) {
        return isMatch(loadedProcess.data, queryFields, queryValues);
    });
}
exports.findByValue = findByValue;

function isMatch(processData, queryFields, queryValues) {
    var i;
    for(i = 0; i < queryFields.length; i++) {
        var field = queryFields[i];
        if(processData.hasOwnProperty(field)) {
            if (processData[field] !== queryValues[field]) {
                // Field present but values does not match.
                return false;
            }
        }
        else {
            // Field not present
            return false;
        }
    }
    return true;
}
