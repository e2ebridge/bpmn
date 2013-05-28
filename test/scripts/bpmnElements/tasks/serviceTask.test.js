/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmnProcessModule = require('../../../../lib/process.js');
var BPMNProcessDefinition = require('../../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../../lib/parsing/gateways.js").BPMNExclusiveGateway;


exports.testBPMNServiceTask = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyServiceTask", "serviceTask"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyStart",
                        "owningProcessId": "myFirstServiceTaskProcess"
                    }
                ],
                "testBPMNServiceTask: state at MyStart"
            );
            done(data);
        },
        "MyServiceTask": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyServiceTask",
                        "owningProcessId": "myFirstServiceTaskProcess"
                    }
                ],
                "testBPMNServiceTask: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);
        },
        "MyEnd": function(data, done) {
            var state = this.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyEnd",
                        "owningProcessId": "myFirstServiceTaskProcess"
                    }
                ],
                "testBPMNServiceTask: state at MyEnd"
            );
            var history = this.getHistory();
            test.deepEqual(history.historyEntries,
                [
                    {
                        "name": "MyStart"
                    },
                    {
                        "name": "MyServiceTask"
                    },
                    {
                        "name": "MyEnd"
                    }
                ],
                "testBPMNServiceTask: history at MyEnd"
            );
            done(data);

            test.done();
        }
    };

    var bpmnProcess = bpmnProcessModule.createBPMNProcess4Testing("myFirstServiceTaskProcess", processDefinition, handler);

    bpmnProcess.triggerEvent("MyStart");

};