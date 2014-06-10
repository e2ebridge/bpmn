/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmnProcesses = require('../../../lib/process.js');
var log = require('../../../lib/logger.js');
var restify = require('restify');
var winston = require('winston');

var DebuggerInterface = require('../../../lib/debugger.js').DebuggerInterface;
var BPMNProcessDefinition = require('../../../lib/parsing/processDefinition.js').BPMNProcessDefinition;
var BPMNTask = require("../../../lib/parsing/tasks.js").BPMNTask;
var BPMNStartEvent = require("../../../lib/parsing/startEvents.js").BPMNStartEvent;
var BPMNEndEvent = require("../../../lib/parsing/endEvents.js").BPMNEndEvent;
var BPMNSequenceFlow = require("../../../lib/parsing/sequenceFlows.js").BPMNSequenceFlow;

exports.testSendingPositionToBPMNEditor = function(test) {

    var mockupDebugServer = restify.createServer();
    mockupDebugServer.use(restify.bodyParser({ mapParams: false }));

    mockupDebugServer.post('/grapheditor/debugger/position', function(req, res, next) {
        res.send(req.body);
        return next();
    });


    mockupDebugServer.listen(57261, function() {
        //console.log('%s listening at %s', mockupDebugServer.name, mockupDebugServer.url);

        var flowObject = {bpmnId: "_123"};
        var debuggerInterface = new DebuggerInterface('http://localhost:57261/grapheditor/debugger/position', "dummyFileName");
        var logger = new log.Logger();
        logger.setLogLevel('debug');
        logger.removeTransport(winston.transports.Console); // keeping the output clean

        debuggerInterface.sendPosition(flowObject, logger, function(error, req, res, obj) {
            test.ok(!error, "testSendingPositionToBPMNEditor: sendPosition: noError");

            test.deepEqual(obj,
                {
                    "filename": "dummyFileName",
                    "position": {
                        "bpmnId": "_123"
                    }
                },
                "testSendingPositionToBPMNEditor: sendPosition: echo of sent body"
            );

            mockupDebugServer.close();
            test.done();
        });
    });
};


exports.testDebuggerRunThrough = function(test) {

    /** @type {BPMNProcessDefinition} */
    var processDefinition = new BPMNProcessDefinition("PROCESS_1", "myProcess");
    processDefinition.addFlowObject(new BPMNStartEvent("_2", "MyStart", "startEvent"));
    processDefinition.addFlowObject(new BPMNTask("_3", "MyServiceTask", "serviceTask"));
    processDefinition.addFlowObject(new BPMNEndEvent("_5", "MyEnd", "endEvent"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_4", "flow1", "sequenceFlow", "_2", "_3"));
    processDefinition.addSequenceFlow(new BPMNSequenceFlow("_6", "flow2", "sequenceFlow", "_3", "_5"));

    var debuggerInterface = new DebuggerInterface('http://localhost:57261/grapheditor/debugger/position', "dummyFileName");

    var traceOfBPMNIds = "";

    // set some mock ups
    debuggerInterface.isInDebugger = function() {
        return true;
    };
    debuggerInterface.createRestClient = function() {
        return {
            post: function(path, message, done) {
               test.equal(path, "/grapheditor/debugger/position", "testDebuggerRunThrough: path");
               test.equal(message.filename, "dummyFileName", "testDebuggerRunThrough: fileName");

                if (message.position.bpmnId) {
                   traceOfBPMNIds += "::" + message.position.bpmnId;
                } else {
                    test.deepEqual(message.position, {}, "testDebuggerRunThrough: empty message used to clear the bpmn editor view");
                }
                done();
            },
            close: function() {
                traceOfBPMNIds += "::CLOSED";
            }
        };
    };
    processDefinition.debuggerInterface = debuggerInterface;

    var handler = {
        "MyStart": function(data, done) {
            done(data);
        },
        "MyServiceTask": function(data, done) {
            done(data);
        },
        "MyEnd": function(data, done) {
            test.equal(traceOfBPMNIds, "::_2::CLOSED::_3::CLOSED::_5::CLOSED", "testDebuggerRunThrough: traceOfBPMNIds");
            test.done();
            done(data);
        }
    };

    bpmnProcesses.createBPMNProcess("testDebuggerRunThrough1", processDefinition, handler, function(err, bpmnProcess){

        test.ok(bpmnProcess.isDebuggerEnabled(), "testDebuggerRunThrough: isDebuggerEnabled");
        bpmnProcess.triggerEvent("MyStart");

    });
};
