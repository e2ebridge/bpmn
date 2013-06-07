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
 * @returns {Array.<BPMNProcessClient>}
 */
function findByProperty(query, bpmnProcesses) {
    var foundProcesses = [];
    var queryFields = query ? Object.getOwnPropertyNames(query) : [];
    var findAll = !query;

    bpmnProcesses = bpmnProcesses || getAllLoadedProcesses();
    bpmnProcesses.forEach(function(bpmnProcess) {
        if (findAll || hasMatchingProperty(bpmnProcess.data, queryFields, query)) {
            foundProcesses.push(bpmnProcess.processClient);
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
 * @param {Array.<BPMNProcess | BPMNProcessClient>=} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcessClient>}
 */
function findByState(flowObjectName, bpmnProcesses) {
    var foundProcesses = [];
    var findAll = !flowObjectName;

    bpmnProcesses = bpmnProcesses || getAllLoadedProcesses();
    bpmnProcesses.forEach(function(bpmnProcess) {
        if (findAll || bpmnProcess.getState().hasTokens(flowObjectName)) {
            foundProcesses.push(bpmnProcess.processClient);
        }
    });
    return foundProcesses;
}
exports.findByState = findByState;

/**
 * @param {String} processName.
 * @param {Boolean=} caseSensitive
 * @param {Array.<BPMNProcess | BPMNProcessClient>=} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcessClient>}
 */
function findByName(processName, caseSensitive, bpmnProcesses) {
    var foundProcesses = [];

    if (processName) {
        var compare = function(a, b) {
            if (caseSensitive === undefined || caseSensitive) {
                return (a === b);
            } else {
                return (a.toLowerCase() === b.toLowerCase());
            }
        };

        bpmnProcesses = bpmnProcesses || getAllLoadedProcesses();
        bpmnProcesses.forEach(function(bpmnProcess) {
            var name = bpmnProcess.processDefinition.name;
            if (compare(name, processName)) {
                foundProcesses.push(bpmnProcess.processClient);
            }
        });
    }
    return foundProcesses;
}
exports.findByName = findByName;