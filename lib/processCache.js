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
 * @returns {Array.<BPMNProcess | BPMNProcessClient>}
 */
function findByProperty(query, bpmnProcesses) {
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
}
exports.findByProperty = findByProperty;

/**
 * @param {Object} processData
 * @param {Array.<Object>} queryFields
 * @param {Array.<String|Number|Boolean|Date>} queryValues
 * @returns {Boolean}
 */
function hasMatchingProperties(processData, queryFields, queryValues) {
    var isMatching = true;
    queryFields.forEach(function (queryField){
        if (isMatching) {  // AND semantics: if it is false once, it stays false
            isMatching = hasMatchingProperty(processData, queryField, queryValues[queryField]);
        }
     });
    return isMatching;
}
exports.hasMatchingProperties = hasMatchingProperties;

/**
 *
 * @param {Object} processData
 * @param {String} propertyName
 * @param {String|Number|Boolean|Date} queryValue
 * @returns {Boolean}
 */
function hasMatchingProperty(processData, propertyName, queryValue) {
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
}
exports.hasMatchingProperty = hasMatchingProperty;

/**
 * Returns all processes where the current task, activity, or event name equals the given state name
 * @param {String} stateName.
 * @param {Array.<BPMNProcess | BPMNProcessClient>=} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcess | BPMNProcessClient>}
 */
function findByState(stateName, bpmnProcesses) {
    var foundProcesses = [];
    var findAll = !stateName;

    bpmnProcesses = bpmnProcesses || getAllLoadedProcesses();
    bpmnProcesses.forEach(function(bpmnProcess) {
        if (findAll || bpmnProcess.getState().hasTokens(stateName)) {
            foundProcesses.push(bpmnProcess.processClient || bpmnProcess);
        }
    });
    return foundProcesses;
}
exports.findByState = findByState;

/**
 * @param {String} processName.
 * @param {Boolean=} caseSensitive
 * @param {Array.<BPMNProcess | BPMNProcessClient>=} bpmnProcesses List of processes the query is applied to. Default: all loaded processes.
 * @returns {Array.<BPMNProcess | BPMNProcessClient>}
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
                foundProcesses.push(bpmnProcess.processClient || bpmnProcess);
            }
        });
    }
    return foundProcesses;
}
exports.findByName = findByName;