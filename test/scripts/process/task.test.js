/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var BPMNProcessDefinition = require('../../../lib/bpmn/processDefinition.js').BPMNProcessDefinition;
var BPMNProcess = require('../../../lib/process.js').BPMNProcess;
var Persistency = require('../../../lib/persistency.js').Persistency;
var BPMNTask = require("../../../lib/bpmn/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/bpmn/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/bpmn/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/bpmn/sequenceFlows.js").BPMNSequenceFlow;
var BPMNExclusiveGateway = require("../../../lib/bpmn/gateways.js").BPMNExclusiveGateway;


exports.testSimpleBPMNProcess = function(test) {
    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addStartEvent(new BPMNStartEvent("_2", "MyStart", "startEvent", [], ["_4"]));
    processDefinition.addTask(new BPMNTask("_3", "MyTask", "task", ["_4"], ["_6"]));
    processDefinition.addEndEvent(new BPMNEndEvent("_5", "MyEnd", "endEvent", ["_6"], []));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var handler = {
        "MyStart": function(data, done) {
            var state = this.getState();
            test.deepEqual(state,
                {
                    "tokens": [
                        {
                            "position": "MyStart"
                        }
                    ]
                },
                "testSimpleBPMNProcess: state at MyStart"
            );
            done(data);
        },
        "MyTask": function(data, done) {
            var state = this.getState();
            test.deepEqual(state,
                {
                    "tokens": [
                        {
                            "position": "MyTask"
                        }
                    ]
                },
                "testSimpleBPMNProcess: state at MyTask"
            );
            this.data = {myproperty: "blah"};
            done(data);

            bpmnProcess.taskDone("MyTask");
        },
        "MyTaskDone": function(data, done) {
            var state = this.getState();
            test.deepEqual(state,
                {
                    "tokens": [
                        {
                            "position": "MyTask"
                        }
                    ]
                },
                "testSimpleBPMNProcess: state at MyTaskDone"
            );
            test.deepEqual(this.data,
                {
                    "myproperty": "blah"
                },
                "testSimpleBPMNProcess: test data"
            );
            done(data);
        },
        "MyEnd": function(data, done) {
            var state = this.getState();
            test.deepEqual(state,
                {
                    "tokens": [
                        {
                            "position": "MyEnd"
                        }
                    ]
                },
                "testSimpleBPMNProcess: state at MyEnd"
            );

            done(data);

            test.done();
        }
    };

    var bpmnProcess = new BPMNProcess("myFirstProcess", processDefinition, handler);

    bpmnProcess.emitEvent("MyStart");

};