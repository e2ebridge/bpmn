/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

function HistoryEntry(flowObjectName) {
    this.name = flowObjectName;
}
exports.HistoryEntry = HistoryEntry;

/**
 * @param {BPMNProcessHistory} history For explicit given history. For example, after loading persisted state
 * @constructor
 */
function BPMNProcessHistory(history) {
    /** @type {Array.<HistoryEntry>} */
    this.historyEntries = history && history.historyEntries ? history.historyEntries : [];
}
exports.BPMNProcessHistory = BPMNProcessHistory;

/**
 * @param {String} flowObjectName
 */
BPMNProcessHistory.prototype.addEntry = function(flowObjectName) {
    this.historyEntries.push(new HistoryEntry(flowObjectName));
};

/**
 * @param {String} flowObjectName
 * @return {HistoryEntry}
 */
BPMNProcessHistory.prototype.getLastEntry = function(flowObjectName) {
    var lastEntry = null;
    this.historyEntries.forEach(function(entry) {
        if (entry.name === flowObjectName) {
           lastEntry = entry;
        }
    });
    return lastEntry;
};

/**
 * @param {String} flowObjectName
 * @return {Boolean}
 */
BPMNProcessHistory.prototype.hasBeenVisited = function(flowObjectName) {
    return hasBeenVisited(this.historyEntries, flowObjectName);
};

function hasBeenVisited(historyEntries, flowObjectName) {
    var found = false;
    historyEntries.forEach(function(entry) {
        if (entry.name === flowObjectName) {
            found = true;
        }
    });
    if (!found) {
        historyEntries.forEach(function(entry) {
            if (entry.subhistory && hasBeenVisited(entry.subhistory.historyEntries, flowObjectName)) {
                found = true;
            }
        });
    }
    return found;
}