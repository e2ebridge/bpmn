/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcess = require('../../../lib/execution/process.js').BPMNProcess;
var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNCallActivity = require("../../../lib/bpmn/callActivity.js").BPMNCallActivity;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../lib/bpmn/gateways.js").BPMNExclusiveGateway;


exports.testBPMNCallActivity = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNCallActivity("_3", "MyCallActivity", "callActivity", "MyTaskExampleProcess", "http://sourceforge.net/bpmn/definitions/_1363693864276"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyStart"
                    }
                ],
                "testBPMNCallActivity: state at MyStart"
            );
            done(data);
        },
        "MyCallActivity": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyCallActivity"
                    }
                ],
                "testBPMNCallActivity: state at MyCallActivity"
            );
            this.data = {myproperty: "blah"};
            done(data);

            bpmnProcess.taskDone("MyCallActivity");
        },
        "MyEnd": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyEnd"
                    }
                ],
                "testBPMNCallActivity: state at MyEnd"
            );
            var history = this.getHistory();
            test.deepEqual(history,
                [
                    "MyStart",
                    "MyCallActivity",
                    "MyEnd"
                ],
                "testBPMNCallActivity: history at MyEnd"
            );
            done(data);

            test.done();
        }
    };

    var bpmnProcess = new BPMNProcess("myFirstProcess", processDefinition, handler);

    bpmnProcess.sendStartEvent("MyStart");

};