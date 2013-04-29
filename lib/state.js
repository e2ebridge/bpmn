/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {String} flowObjectName
 * @param {String} owningProcessId
 * @constructor
 */
function Token(flowObjectName, owningProcessId) {
    this.position = flowObjectName;
    this.substate = null;
    this.owningProcessId = owningProcessId;
}
exports.Token = Token;

/**
 * @param {BPMNProcessState} state For explicit given states. For example, after loading persisted state
 * @constructor
 */
function BPMNProcessState(state) {
    /** @type {Array.<Token>} */
    this.tokens = state && state.tokens ? state.tokens : [];
}
exports.BPMNProcessState = BPMNProcessState;

/**
 * @param {String} flowObjectName
 * @param {String} owningProcessId
 * @return {Token}
 */
BPMNProcessState.prototype.createTokenAt = function(flowObjectName, owningProcessId) {
    var newToken = new Token(flowObjectName, owningProcessId);
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
    var hasTokenAt = false;
    if (flowObject) {
        this.tokens.forEach(function(token){
            if (flowObject.name === token.position) {
                hasTokenAt = true;
            }
        });
    }

    return hasTokenAt;
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




