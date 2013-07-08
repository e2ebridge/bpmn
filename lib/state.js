/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var util = require('util');

/**
 * @param {String} flowObjectName
 * @param {String} owningProcessId
 * @constructor
 */
var Token = exports.Token = function(flowObjectName, owningProcessId) {
    this.position = flowObjectName;
    this.owningProcessId = owningProcessId;
};

/**
 * @param {String} flowObjectName
 * @param {String} owningProcessId
 * @param {String} calledProcessId
 * @constructor
 */
var CallActivityToken = exports.CallActivityToken = function(flowObjectName, owningProcessId, calledProcessId) {
    Token.call(this, flowObjectName, owningProcessId);
    this.substate = null;
    this.calledProcessId = calledProcessId;
};
util.inherits(CallActivityToken, Token);

/**
 * @param {BPMNProcessState} state For explicit given states. For example, after loading persisted state
 * @constructor
 */
var BPMNProcessState = exports.BPMNProcessState = function(state) {
    /** @type {Array.<Token>} */
    this.tokens = state && state.tokens ? state.tokens : [];
};

/**
 * @param {String} flowObjectName
 * @param {String} owningProcessId
 * @param {String=} calledProcessId
 * @return {Token}
 */
BPMNProcessState.prototype.createTokenAt = function(flowObjectName, owningProcessId, calledProcessId) {
    var newToken;

    if (calledProcessId) {
        newToken = new CallActivityToken(flowObjectName, owningProcessId, calledProcessId);
    } else {
        newToken = new Token(flowObjectName, owningProcessId);
    }
    this.tokens.push(newToken);

    return newToken;
};

/**
 * @param {String} flowObjectName
 * @return {Array.<Token>}
 */
BPMNProcessState.prototype.findTokens = function(flowObjectName) {
    var foundTokens = [];
    findTokens(flowObjectName, this.tokens, foundTokens);
    return foundTokens;
};

/**
 * @param {String} flowObjectName
 * @param {Array.<Token>} currentTokens
 * @param {Array.<Token>} foundTokens
 */
function findTokens(flowObjectName, currentTokens, foundTokens) {
    currentTokens.forEach(function(token) {
        if (token.position === flowObjectName) {
            foundTokens.push(token);
        }
        if (token.substate) {
            findTokens(flowObjectName, token.substate.tokens, foundTokens);
        }
    });
}

/**
 * @return {Array.<Token>}
 */
BPMNProcessState.prototype.findCallActivityTokens = function() {
    var foundTokens = [];

    this.tokens.forEach(function(token) {
        if (token.calledProcessId) {
            foundTokens.push(token);
        }
    });

    return foundTokens;
};

/**
 * @param {String} flowObjectName
 * @return {Token}
 */
BPMNProcessState.prototype.getFirstToken = function(flowObjectName) {
    var tokensAtActivity = this.findTokens(flowObjectName);
    return (tokensAtActivity && tokensAtActivity.length > 0 ? tokensAtActivity[0] : null);
};

/**
 * @param {BPMNFlowObject} flowObject
 */
BPMNProcessState.prototype.removeTokenAt = function(flowObject) {
    var tokenHasBeenRemoved = false;
    var newTokens = [];
    var oldTokens = this.tokens;

    oldTokens.forEach(function(token) {
        // we remove a token by copying all references except one token
        if (tokenHasBeenRemoved) {
            newTokens.push(token);
        } else {
            if (token.position === flowObject.name) {
                tokenHasBeenRemoved = true;
            } else {
                newTokens.push(token);
            }
        }
    });

    this.tokens = newTokens;
};

/**
 * @param {BPMNFlowObject} flowObject
 */
BPMNProcessState.prototype.removeAllTokensAt = function(flowObject) {
    var newTokens = [];
    var oldTokens = this.tokens;

    oldTokens.forEach(function(token) {
        if (token.position !== flowObject.name) {
            newTokens.push(token);
        }
    });

    this.tokens = newTokens;
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Boolean}
 */
BPMNProcessState.prototype.hasTokensAt = function(flowObject) {
    return (flowObject ? this.hasTokens(flowObject.name) : false);
};

/**
 * @param {String} flowObjectName
 * @return {Boolean}
 */
BPMNProcessState.prototype.hasTokens = function(flowObjectName) {
    var tokens = this.findTokens(flowObjectName);
    return (tokens.length > 0);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @return {Number}
 */
BPMNProcessState.prototype.numberOfTokensAt = function(flowObject) {
    var count = 0;

    if (flowObject) {
        this.tokens.forEach(function(token) {
            if (flowObject.name === token.position) {
                count++;
            }
        });
    }

    return count;
};




