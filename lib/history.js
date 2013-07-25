/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var endEvents = require('./parsing/endEvents.js');

var getTimestamp = Date.now;
exports.setTimestampFunction = function(getTimestampFunction) {
    getTimestamp = getTimestampFunction;
};
exports.setDummyTimestampFunction = function() {
    getTimestamp = function () { return "_dummy_ts_"; };
};

/**
 * @param {String} name
 * @param {String} type
 * @param {Number=} begin Timestamp in ms
 * @param {Number=} end
 * @constructor
 */
var HistoryEntry = exports.HistoryEntry = function(name, type, begin, end) {
    this.name = name;
    this.type = type;
    this.begin = begin || getTimestamp();
    this.end = end || null;
};

HistoryEntry.prototype.setEnd = function() {
    this.end = getTimestamp();
};

/**
 * @param {BPMNProcessHistory} history For explicit given history. For example, after loading persisted state
 * @constructor
 */
var BPMNProcessHistory = exports.BPMNProcessHistory = function(history) {
    /** @type {Array.<HistoryEntry>} */
    this.historyEntries = [];

    if (history) {
        this.historyEntries = history.historyEntries.map(function(historyEntry) {
            var entry = new HistoryEntry(historyEntry.name, historyEntry.type, historyEntry.begin, historyEntry.end);
            if (historyEntry.subhistory) {
                entry.subhistory = new BPMNProcessHistory(historyEntry.subhistory);
            }
            return entry;
        });
        this.createdAt = history.createdAt;
        this.finishedAt = history.finishedAt || null;
    } else {
        this.createdAt = getTimestamp();
        this.finishedAt = null;
    }
};

/**
 * @param {BPMNFlowObject} flowObject
 */
BPMNProcessHistory.prototype.addEntry = function(flowObject) {
    this.historyEntries.push(new HistoryEntry(flowObject.name, flowObject.type));
};

/**
 * @param {String} flowObjectName
 * @return {HistoryEntry}
 */
BPMNProcessHistory.prototype.getLastEntry = function(flowObjectName) {
    var lastEntry = null;
    var last =  this.historyEntries.length - 1;
    var i;

    for (i=last; i >= 0; i--) {
        var entry = this.historyEntries[i];
        if (entry.name === flowObjectName) {
            lastEntry = entry;
            break;
        }
    }

    return lastEntry;
};

/**
 * @param {String} flowObjectName
 */
BPMNProcessHistory.prototype.setEnd = function(flowObjectName) {
    var historyEntry = this.getLastEntry(flowObjectName);
    historyEntry.setEnd();
    if (endEvents.isEndEventName(historyEntry.type)) {
        this.finishedAt = historyEntry.end;
    }
};

BPMNProcessHistory.prototype.isFinished = function() {
    if(this.historyEntries.length){
        return endEvents.isEndEventName(this.historyEntries[this.historyEntries.length - 1].type)
    }

    return false;
}

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