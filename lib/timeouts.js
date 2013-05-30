/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var handlerModule = require('./handler.js');
var getTimeoutHandlerPostfix = handlerModule.handlerNameSeparator + "getTimeout";

/**
 * @param {Integer} timeout
 * @param {Boolean} isRelative
 * @constructor
 */
function Timeout(timeout, isRelative) {
    var at, now;

    if (isRelative) {
        now = Date.now();
        at = now + timeout;
    } else {
        at = timeout;
    }

    this.at = at;
    this.timeout = timeout;
}

/**
 * @constructor
 */
function BPMNPendingTimeouts(bpmnProcess) {
    /** @type {Array.<Timeout>} */
    this.eventName2TimeoutMap = {};
    this.bpmnProcess = bpmnProcess;
    this.setTimeoutIds = {};
}
exports.BPMNPendingTimeouts = BPMNPendingTimeouts;

/**
 * @return {Boolean}
 */
BPMNPendingTimeouts.prototype.hasTimeouts = function() {
    return (Object.keys(this.eventName2TimeoutMap).length > 0);
};

/**
 * @param {String} timeoutEventName
 * @return {Timeout}
 */
BPMNPendingTimeouts.prototype.getTimeout = function(timeoutEventName) {
    return this.eventName2TimeoutMap[timeoutEventName];
};

/**
 * @param {String} timeoutEventName
 */
BPMNPendingTimeouts.prototype.removeTimeout = function(timeoutEventName) {
    if (this.eventName2TimeoutMap[timeoutEventName]) {
        delete this.eventName2TimeoutMap[timeoutEventName];
    }

    if (this.setTimeoutIds[timeoutEventName]) {
        clearTimeout(this.setTimeoutIds[timeoutEventName]);
        delete this.setTimeoutIds[timeoutEventName];
    }
};

/**
 * @param {Object} eventName2TimeoutMap Object that maps timeout event names to timeouts
 */
BPMNPendingTimeouts.prototype.addTimeouts = function(eventName2TimeoutMap) {
    var self = this;
    if (eventName2TimeoutMap) {
        Object.keys(eventName2TimeoutMap).forEach(function(eventName) {
            self.addBoundaryTimerEvent(eventName, eventName2TimeoutMap(eventName));
        });
    }
};

/**
 * @param {BPMNBoundaryEvent} timerEvent
 * @param {Timeout=} pendingTimeout If given, this timeout object is added to the pending timeouts.
 *                                  If not given, a new timeout will be created.
 */
BPMNPendingTimeouts.prototype.addBoundaryTimerEvent = function(timerEvent, pendingTimeout) {
    var bpmnProcess = this.bpmnProcess;
    var self = this;
    var timerEventName = timerEvent.name;
    var timerEventHandler = function() {
        bpmnProcess.logger.logBoundaryTimerEvent(timerEvent);
        self.removeTimeout(timerEventName);
        bpmnProcess._putTokenAt(timerEventName);
    };

    this.addTimeout(timerEventName, pendingTimeout, timerEventHandler);
};

/**
 * @param {BPMNIntermediateCatchEvent} timerEvent
 * @param {Timeout=} pendingTimeout If given, this timeout object is added to the pending timeouts.
 *                                  If not given, a new timeout will be created.
 */
BPMNPendingTimeouts.prototype.addIntermediateTimerEvent = function(timerEvent, pendingTimeout) {
    var bpmnProcess = this.bpmnProcess;
    var self = this;
    var timerEventName = timerEvent.name;
    var timerEventHandler = function() {
        bpmnProcess.logger.logIntermediateCatchTimerEvent(timerEvent);
        bpmnProcess.state.removeTokenAt(timerEvent);
        self.removeTimeout(timerEventName);
        var handlerDone = function() {
            timerEvent.emitTokens(bpmnProcess);
        };
        handlerModule.callHandler(timerEventName, bpmnProcess, null, handlerDone);
    };

    this.addTimeout(timerEventName, pendingTimeout, timerEventHandler);
};

/**
 * @param {String} timeoutEventName
 * @param {Timeout=} pendingTimeout If given, this timeout object is added to the pending timeouts.
 *                                  If not given, a new timeout will be created.
 * @param {Function=} timeoutEventHandler
 */
BPMNPendingTimeouts.prototype.addTimeout = function(timeoutEventName, pendingTimeout, timeoutEventHandler) {
    var bpmnProcess = this.bpmnProcess;
    var self = this;

    var getTimeoutHandlerName = timeoutEventName + getTimeoutHandlerPostfix;
    var timeoutValue = handlerModule.callHandler(getTimeoutHandlerName, bpmnProcess);

    if (isNaN(timeoutValue)) {
        throw Error("The getTimeout handler '" + getTimeoutHandlerName + "' does not return a number but '" + timeoutValue + "'");
    } else {
        //console.log("Set timeout for '" + timeEventName + "' timeout=" + timeout);
        var timeoutObject = pendingTimeout || new Timeout(timeoutValue, true);
        self.eventName2TimeoutMap[timeoutEventName] = timeoutObject;

        var now = Date.now();
        var diff = timeoutObject.at - now;
        if (diff > 0) {
            self.setTimeoutIds[timeoutEventName] = setTimeout(timeoutEventHandler, diff);
        } else {
            putTokenAt();
        }
    }
};
