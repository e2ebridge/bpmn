/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {BPMNFlowObject} flowObject
 * @constructor
 */
function Token(flowObject) {
    this.position = flowObject.name;
    this.createdAt = flowObject.name;
}

/**
 * @param {BPMNFlowObject} nextFlowObject
 */
Token.prototype.moveTo = function(nextFlowObject) {
    this.position = nextFlowObject;
};

function BPMNProcessState() {
    /**
     * @type {Array.<Token>}
     */
    this.tokens = [];
}
exports.BPMNProcessState = BPMNProcessState;


/**
 * @param {BPMNFlowObject} flowObject
 */
BPMNProcessState.prototype.createTokenAt = function(flowObject) {
    this.createTokensAt(flowObject, 1);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @param {int} noOfTokens
 */
BPMNProcessState.prototype.createTokensAt = function(flowObject, noOfTokens) {
     var i;
    for (i=0; i < noOfTokens; i++) {
        this.tokens.push(new Token(flowObject));
    }
};

/**
 * @param flowObject
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
 * @return {Boolean}
 */
BPMNProcessState.prototype.hasNoTokens = function() {
    return (this.tokens.length === 0);
};

