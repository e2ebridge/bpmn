/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var handlerModule = require('./handler.js');
var getTimeoutHandlerPostfix = handlerModule.handlerNameSeparator + "getTimeout";

/**
 * @param {String} timeEventName
 * @param {Integer} timeout
 * @param {Boolean} isRelative
 * @constructor
 */
function Timeout(timeEventName, timeout, isRelative) {
    var at, now;

    if (isRelative) {
        now = Date.now();
        at = now + timeout;
    } else {
        at = timeout;
    }

    this.eventName = timeEventName;
    this.at = at;
    this.timeout = timeout;
}

/**
 * @param {BPMNPendingTimeouts} pendingTimeouts For explicit given timeouts. For example, after loading persisted state
 * @param {BPMNProcess} bpmnProcess
 * @constructor
 */
function BPMNPendingTimeouts(bpmnProcess, pendingTimeouts) {
    /** @type {Array.<Timeout>} */
    this.pendingTimeouts = pendingTimeouts || {};
    this.bpmnProcess = bpmnProcess;
    this.timeoutChecker = {};
}
exports.BPMNPendingTimeouts = BPMNPendingTimeouts;

/**
 * @return {Boolean}
 */
BPMNPendingTimeouts.prototype.hasTimeouts = function() {
    return (Object.keys(this.pendingTimeouts).length > 0);
};

/**
 * @param {String} timeoutEventName
 * @return {Timeout}
 */
BPMNPendingTimeouts.prototype.getTimeout = function(timeoutEventName) {
    return this.pendingTimeouts[timeoutEventName];
};

/**
 * @param {String} timeoutEventName
 */
BPMNPendingTimeouts.prototype.removeTimeout = function(timeoutEventName) {
    var pendingTimeout = this.pendingTimeouts[timeoutEventName];
    if (pendingTimeout) {
        clearInterval(this.timeoutChecker[timeoutEventName]);
        delete this.timeoutChecker[timeoutEventName];
        delete this.pendingTimeouts[timeoutEventName];
    }
};

/**
 * @param {String} timeoutEventName
 */
BPMNPendingTimeouts.prototype.addTimeout = function(timeoutEventName) {
    var bpmnProcess = this.bpmnProcess;
    var self = this;

    var getTimeoutHandlerName = timeoutEventName + getTimeoutHandlerPostfix;
    var timeout = handlerModule.callHandler(getTimeoutHandlerName, bpmnProcess);

    if (isNaN(timeout)) {
        throw Error("The getTimeout handler '" + getTimeoutHandlerName + "' does not return a number but '" + timeout + "'");
    } else {
        // TODO: this part has to be run through while loading the process!!!!!
        var checkTimeout = function() {
            /** {BPMNActivityTimeout} */
            var pendingTimeout = self.pendingTimeouts[timeoutEventName];
            //console.log("Check timeout for '" + pendingTimeout.eventName + "' at=" + Date.now());
            if (pendingTimeout) {
                var now = Date.now();
                if (now > pendingTimeout.at) {
                    //console.log("Reached timeout for '" + pendingTimeout.eventName + "' at=" + pendingTimeout.at + ", now=" + now);
                    self.removeTimeout(timeoutEventName);
                    bpmnProcess._putTokenAt(pendingTimeout.eventName);
                }
            }
        };

        //console.log("Set timeout for '" + timeEventName + "' timeout=" + timeout);
        self.pendingTimeouts[timeoutEventName] = new Timeout(timeoutEventName, timeout, true);
        self.timeoutChecker[timeoutEventName] = setInterval(checkTimeout, 250); // TODO: checking time should be not more less 1/1000 of the timeout time
    }
};
