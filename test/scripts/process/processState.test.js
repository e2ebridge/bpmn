/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcessState = require("../../../lib/processState.js").BPMNProcessState;
var BPMNFlowObject = require("../../../lib/bpmn/flowObject.js").BPMNFlowObject;

var gateway = new BPMNFlowObject("_2", "Parallel Gateway1", "parallelGateway");
var startEvent = new BPMNFlowObject("_1", "Start Event1", "startEvent");

exports.testBPMNProcessStateCreateTokens = function(test) {

    var state = new BPMNProcessState();
    state.createTokenAt(startEvent);
    state.createTokensAt(gateway, 3);

    test.deepEqual(state,
        {
            "tokens": [
                {
                    "position": "Start Event1",
                    "createdAt": "Start Event1"
                },
                {
                    "position": "Parallel Gateway1",
                    "createdAt": "Parallel Gateway1"
                },
                {
                    "position": "Parallel Gateway1",
                    "createdAt": "Parallel Gateway1"
                },
                {
                    "position": "Parallel Gateway1",
                    "createdAt": "Parallel Gateway1"
                }
            ]
        },
        "testBPMNProcessStateCreateTokens"
    );

    test.done();
};

exports.testBPMNProcessStateRemoveToken = function(test) {
    var state = new BPMNProcessState();
    state.createTokenAt(startEvent);
    state.createTokensAt(gateway, 3);

    state.removeTokenAt(gateway);

    test.deepEqual(state,
        {
            "tokens": [
                {
                    "position": "Start Event1",
                    "createdAt": "Start Event1"
                },
                {
                    "position": "Parallel Gateway1",
                    "createdAt": "Parallel Gateway1"
                },
                {
                    "position": "Parallel Gateway1",
                    "createdAt": "Parallel Gateway1"
                }
            ]
        },
        "testBPMNProcessStateRemoveToken"
    );

    test.done();
};

exports.testBPMNProcessStateHasToken = function(test) {
    var state = new BPMNProcessState();
    state.createTokenAt(startEvent);

    var test1 = state.hasTokensAt(null);
    test.equal(test1, false, "testBPMNProcessStateHasToken: flowObject = null");

    var test2 = state.hasTokensAt(startEvent);
    test.equal(test2, true, "testBPMNProcessStateHasToken: startEvent");

    state.removeTokenAt(startEvent);

    var test3 = state.hasTokensAt(startEvent);
    test.equal(test3, false, "testBPMNProcessStateHasToken: startEvent after removing");

    test.done();
};
