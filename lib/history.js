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
    var lastEntry;
    this.historyEntries.forEach(function(entry) {
        if (entry.name === flowObjectName) {
           lastEntry = entry;
        }
    });
    return lastEntry;
};