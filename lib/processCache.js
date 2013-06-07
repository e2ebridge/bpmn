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

/**
 * @param {Object} query The query is an object that is being matched to the data.
 * @returns {Array.<BPMNProcessClient>}
 */
function findByProperty(query) {
    var foundProcesses = [];
    var queryFields = query ? Object.getOwnPropertyNames(query) : [];
    var findAll = !query;
    var allLoadedProcessIds = Object.keys(processCache);
    allLoadedProcessIds.forEach(function(loadedProcessId) {
        var loadedProcess = get(loadedProcessId);
        if (findAll || hasMatchingProperty(loadedProcess.data, queryFields, query)) {
            foundProcesses.push(loadedProcess.processClient);
        }
    });
    return foundProcesses;
}
exports.findByProperty = findByProperty;

function hasMatchingProperty(processData, queryFields, queryValues) {
    var isMatching = false;
    queryFields.forEach(function (field){
        if(processData.hasOwnProperty(field)) {
            if (processData[field] === queryValues[field]) {
                 isMatching = true;
            }
        }
    });
    return isMatching;
}

/**
 * @param {String} flowObjectName.
 * @returns {Array.<BPMNProcessClient>}
 */
function findByState(flowObjectName) {
    var foundProcesses = [];
    var findAll = !flowObjectName;
    var allLoadedProcessIds = Object.keys(processCache);
    allLoadedProcessIds.forEach(function(loadedProcessId) {
        var loadedProcess = get(loadedProcessId);
        if (findAll || loadedProcess.getState().hasTokens(flowObjectName)) {
            foundProcesses.push(loadedProcess.processClient);
        }
    });
    return foundProcesses;
}
exports.findByState = findByState;

/**
 * @param {String} processName.
 * @param {Boolean=} caseSensitive
 * @returns {Array.<BPMNProcessClient>}
 */
function findByName(processName, caseSensitive) {
    var foundProcesses = [];

    var compare = function(a, b) {
        if (caseSensitive === undefined || caseSensitive) {
            return (a === b);
        } else {
            return (a.toLowerCase() === b.toLowerCase());
        }
    };

    if (processName) {
        var allLoadedProcessIds = Object.keys(processCache);
        allLoadedProcessIds.forEach(function(loadedProcessId) {
            var loadedProcess = get(loadedProcessId);
            var name = loadedProcess.processDefinition.name;
            if (compare(name, processName)) {
                foundProcesses.push(loadedProcess.processClient);
            }
        });
    }
    return foundProcesses;
}
exports.findByName = findByName;