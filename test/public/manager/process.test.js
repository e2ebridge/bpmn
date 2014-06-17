/**
 * Copyright: E2E Technologies Ltd
 * Author: Cyril Schmitt <cschmitt@e2ebridge.com>
 */
"use strict";

var path = require('path');
var fs = require('fs');

var Manager = require('../../../lib/manager').ProcessManager;

exports.testCreateVolatileBPMNProcess = function(test) {

    var manager = new Manager({
        bpmnFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"),
        handlerFilePath: {name: 'TaskExampleProcess', filePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn")}
    });

    manager.createProcess('myid', function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {
            var state = bpmnProcess.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myid"
                    }
                ],
                "testCreateVolatileBPMNProcess: reached first wait state."
            );

            test.done();
        });
    });

};

exports.testCreateVolatileBPMNProcessXML = function(test) {

    var bpmnXML = fs.readFileSync(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"), 'utf-8');
    var handlerString = fs.readFileSync(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.js"), 'utf-8');

    var manager = new Manager({
        bpmnXML: {name: 'TaskExampleProcess', xml: bpmnXML},
        handlerString: {name: 'TaskExampleProcess', string: handlerString}
    });

    manager.createProcess('myid', function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {
            var state = bpmnProcess.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myid"
                    }
                ],
                "testCreateVolatileBPMNProcess: reached first wait state."
            );

            test.done();
        });
    });

};

exports.testCreateVolatileBPMNProcessXMLByAdd = function(test) {

    var bpmnXML = fs.readFileSync(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"), 'utf-8');
    var handlerString = fs.readFileSync(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.js"), 'utf-8');

    var manager = new Manager();
    manager.addBpmnXML(bpmnXML, 'TaskExampleProcess', handlerString);

    manager.createProcess('myid', function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {
            var state = bpmnProcess.getState();
            test.deepEqual(state.tokens,
                [
                    {
                        "position": "MyTask",
                        "owningProcessId": "myid"
                    }
                ],
                "testCreateVolatileBPMNProcessXMLByAdd: reached first wait state."
            );

            test.done();
        });
    });

};


exports.testIdAlreadyUsedError = function(test) {
    test.expect(2);

    var manager = new Manager({
        bpmnFilePath: [path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn")]
    });

    manager.createProcess('myid', function(){
        manager.createProcess('myid', function(err){

            test.equal(err.message, 'id already used', 'testIdAlreadyUsedError: before creation');
        });
    });

    manager.createProcess('myid', function(err){

        test.equal(err.message, 'id already used', 'testIdAlreadyUsedError: when set in cache');
        test.done();

    });

};

exports.testGet = function(test) {

    var manager = new Manager({
        bpmnFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"),
        handler: {
            name: 'TaskExampleProcess',
            module: {
                MyStart: function (data, done) {
                    done(data);
                }
            }
        }
    });

    manager.createProcess({name:'TaskExampleProcess', id:'myid'}, function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {

            manager.get('myid', function(err, process){
                var state = process.getState();
                test.deepEqual(state.tokens,
                    [
                        {
                            "position": "MyTask",
                            "owningProcessId": "myid"
                        }
                    ],
                    "testGet: state."
                );

                test.done();
            });
        });
    });

    manager.get('myid', function(err, bpmnProcess){
        test.equal(bpmnProcess, null, "testGet: no processes");
    });

};

exports.testGetAll = function(test) {

    var manager = new Manager({
        bpmnFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn")
    });

    manager.createProcess('myid', function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart");

        process.nextTick(function() {

            manager.getAllProcesses(function(err, processes){
                test.equal(processes.length, 1, "testGetAll: 1 found.");

                test.done();
            });
        });
    });

    manager.getAllProcesses(function(err, bpmnProcesses){
        test.equal(bpmnProcesses.length, 0, "testGetAll: no processes");
    });

};

exports.testFindByProperty = function(test) {

    var manager = new Manager();

    manager.addBpmnFilePath(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"));

    manager.createProcess('myid', function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart", 'test');

        process.nextTick(function() {

            manager.findByProperty({myFirstProperty: 'test'},function(err, processes){
                test.equal(processes.length, 1, "testFindByProperty: 1 found.");

                test.done();
            });
        });
    });

};

exports.testFindByState = function(test) {

    var manager = new Manager();

    manager.addBpmnFilePath(
        path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"),
        path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.js")
    );

    manager.createProcess('myid', function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart", 'test');

        process.nextTick(function() {

            manager.findByState('MyTask',function(err, processes){
                test.equal(processes.length, 1, "testFindByState: 1 found.");

                test.done();
            });
        });
    });

};

exports.testFindByName = function(test) {

    var manager = new Manager();

    manager.addHandlerFilePath('TaskExampleProcess',
        path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.js"));

    manager.addBpmnFilePath(path.join(__dirname, "../../resources/projects/withoutHandler/taskExampleProcess.bpmn"));

    manager.createProcess('myid', function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart", 'test');

        process.nextTick(function() {

            manager.findByName('TaskExampleProcess',function(err, processes){
                test.equal(processes.length, 1, "testFindByName: 1 found.");

                test.done();
            });
        });
    });

};

exports.testFindByNameCaseSensitive = function(test) {

    var manager = new Manager({
        bpmnFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn")
    });

    manager.createProcess('myid', function(err, bpmnProcess){
        bpmnProcess.triggerEvent("MyStart", 'test');

        process.nextTick(function() {

            manager.findByName('TaskExampleProcess',true,function(err, processes){
                test.equal(processes.length, 1, "testFindByNameCaseSensitive: 1 found.");

                test.done();
            });
        });
    });

};