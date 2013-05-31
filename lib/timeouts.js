/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var handlerModule = require('./handler.js');
var getTimeoutHandlerPostfix = handlerModule.handlerNameSeparator + "getTimeout";

/**
 * @param {Integer} timeoutInMs
 * @param {Boolean} isRelative
 * @constructor
 */
function Timeout(timeoutInMs, isRelative) {
    var at, now;

    if (isRelative) {
        now = Date.now();
        at = now + timeoutInMs;
    } else {
        at = timeoutInMs;
    }

    this.at = at;
    this.timeout = timeoutInMs;
}

/**
 * @constructor
 */
function BPMNPendingTimerEvents(bpmnProcess) {
    /** @type {Array.<Timeout>} */
    this.pendingTimeouts = {};
    this.bpmnProcess = bpmnProcess;
    this.setTimeoutIds = {};
}
exports.BPMNPendingTimerEvents = BPMNPendingTimerEvents;

/**
 * @return {Boolean}
 */
BPMNPendingTimerEvents.prototype.hasTimeouts = function() {
    return (Object.keys(this.pendingTimeouts).length > 0);
};

/**
 * @param {String} timerEventName
 * @return {Timeout}
 */
BPMNPendingTimerEvents.prototype.getTimeout = function(timerEventName) {
    return this.pendingTimeouts[timerEventName];
};

/**
 * @param {String} timerEventName
 */
BPMNPendingTimerEvents.prototype.removeTimeout = function(timerEventName) {
    if (this.pendingTimeouts[timerEventName]) {
        delete this.pendingTimeouts[timerEventName];
    }

    if (this.setTimeoutIds[timerEventName]) {
        clearTimeout(this.setTimeoutIds[timerEventName]);
        delete this.setTimeoutIds[timerEventName];
    }
};

/**
 * @param {Object} pendingTimeouts Object that maps timeout event names to timeouts
 */
BPMNPendingTimerEvents.prototype.restoreTimerEvents = function(pendingTimeouts) {
    var self = this;
    if (pendingTimeouts) {
        var processDefinition = this.bpmnProcess.processDefinition;
        Object.keys(pendingTimeouts).forEach(function(timerEventName) {
            var timerEvent = processDefinition.getFlowObjectByName(timerEventName);
            if (timerEvent.isIntermediateCatchEvent) {
                self.addIntermediateTimerEvent(timerEvent, pendingTimeouts[timerEventName]);
            } else {
                self.addBoundaryTimerEvent(timerEvent, pendingTimeouts[timerEventName]);
            }
        });
    }
};

/**
 * @param {BPMNBoundaryEvent} timerEvent
 * @param {Timeout=} pendingTimeout If given, this timeout object is added to the pending timeouts.
 *                                  If not given, a new timeout will be created.
 */
BPMNPendingTimerEvents.prototype.addBoundaryTimerEvent = function(timerEvent, pendingTimeout) {
    var bpmnProcess = this.bpmnProcess;
    var self = this;
    var timerEventName = timerEvent.name;
    var timerEventHandler = function() {
        bpmnProcess.logger.logBoundaryTimerEvent(timerEvent);
        self.removeTimeout(timerEventName);
        bpmnProcess._putTokenAt(timerEventName);
    };

    this.addTimerEvent(timerEventName, pendingTimeout, timerEventHandler);
};

/**
 * @param {BPMNIntermediateCatchEvent} timerEvent
 * @param {Timeout=} pendingTimeout If given, this object is added to the pending timeouts.
 *                                  If not given, a new timeout will be created.
 */
BPMNPendingTimerEvents.prototype.addIntermediateTimerEvent = function(timerEvent, pendingTimeout) {
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

    this.addTimerEvent(timerEventName, pendingTimeout, timerEventHandler);
};

/**
 * @param {String} timerEventName
 * @param {Timeout=} pendingTimeout If given, this object is added to the pending timeouts.
 *                                  If not given, a new timeout will be created.
 * @param {Function=} timeoutEventHandler
 */
BPMNPendingTimerEvents.prototype.addTimerEvent = function(timerEventName, pendingTimeout, timeoutEventHandler) {
    var bpmnProcess = this.bpmnProcess;
    var self = this;

    var getTimeoutHandlerName = timerEventName + getTimeoutHandlerPostfix;
    var timeoutInMs = handlerModule.callHandler(getTimeoutHandlerName, bpmnProcess);

    if (isNaN(timeoutInMs)) {
        throw Error("The getTimeout handler '" + getTimeoutHandlerName + "' does not return a number but '" + timeoutInMs + "'");
    } else {
        var timeout = pendingTimeout || new Timeout(timeoutInMs, true);
        self.pendingTimeouts[timerEventName] = timeout;

        var now = Date.now();
        var diff = timeout.at - now;
        if (diff > 0) {
            bpmnProcess.logger.logSetTimer(timerEventName, diff);
            self.setTimeoutIds[timerEventName] = setTimeout(timeoutEventHandler, diff);
        } else {
            timeoutEventHandler();
        }
    }
};
