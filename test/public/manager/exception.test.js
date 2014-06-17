/**
 * Copyright: E2E Technologies Ltd
 * Author: Cyril Schmitt <cschmitt@e2ebridge.com>
 */
"use strict";

var path = require('path');
var fs = require('fs');

var Manager = require('../../../lib/manager').ProcessManager;


exports.testHandlerFilePathException = function(test) {
    test.expect(2);

    var manager = null;

    try{
        manager = new Manager({
            bpmnFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"),
            handlerFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn")
        });
    }catch(e){
        test.equal(e.message, 'handlerFilePath needs a name and a filePath', "testHandlerFilePathException: not an object");
    }

    test.equal(manager, null,"testCreateWithoutFilePathException: manager is null");
    test.done();
};

exports.testHandlerException = function(test) {
    test.expect(2);

    var manager = null;

    try{
        manager = new Manager({
            bpmnFilePath: path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"),
            handler: {
                MyStart: function (data, done) {
                    done(data);
                }
            }
        });
    }catch(e){
        test.equal(e.message, 'handler needs a name and a module', "testHandlerException: not name and module");
    }

    test.equal(manager, null,"testCreateWithoutFilePathException: manager is null");
    test.done();
};

exports.testNoHandlerException = function(test) {
    test.expect(1);

    var manager = new Manager();

    try{
        manager.addBpmnFilePath(path.join(__dirname, "../../resources/projects/withoutHandler/taskExampleProcess.bpmn"));

    }catch(e){
        test.equal(e.message,
                'No process handler defined for process "TaskExampleProcess". ' +
                'The process handler must be defined before the process or with the process.',
            "testNoHandlerException: no handler");
    }

    test.done();
};



exports.testBpmnXMLException = function(test) {
    test.expect(2);

    var manager = null;

    try{
        manager = new Manager({
            bpmnXML: "not valid"
        });
    }catch(e){
        test.equal(e.message, 'bpmnXML needs a name and a xml', "testBpmnXMLException: not name and xml");
    }

    test.equal(manager, null,"testBpmnXMLException: manager is null");
    test.done();
};


exports.testBpmnXMLNoHandlerException = function(test) {
    test.expect(2);

    var manager = null;
    var bpmnXML = fs.readFileSync(path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn"), 'utf-8');

    try{
        manager = new Manager({
            bpmnXML: {name: 'TaskExampleProcess', xml: bpmnXML}
        });
    }catch(e){
        test.equal(e.message,
                'No process handler defined for process "TaskExampleProcess". ' +
                'The process handler must be defined before the process or with the process.',
            "testBpmnXMLNoHandlerException: no handler");
    }

    test.equal(manager, null,"testBpmnXMLException: manager is null");
    test.done();
};


exports.testHandlerStringException = function(test) {
    test.expect(2);

    var manager = null;

    try{
        manager = new Manager({
            handlerString: "not valid"
        });
    }catch(e){
        test.equal(e.message, 'handlerString needs a name and a string', "testHandlerStringException: not name and string");
    }

    test.equal(manager, null,"testHandlerStringException: manager is null");
    test.done();
};