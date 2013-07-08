/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var bpmn = require('../../../lib/public.js');

var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByNameEmpty = function(test) {
    bpmn.clearCache();
    var foundProcesses = bpmn.findByName();

    test.equal(foundProcesses.length, 0, "testFindByNameEmpty");

    test.done();
};

exports.testFindByNameEmpty2 = function(test) {
    bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop2", "blah");

    var foundProcesses = bpmn.findByName();

    test.equal(foundProcesses.length, 0, "testFindByNameEmpty2");

    test.done();
};

exports.testFindByNameMatch = function(test) {
    bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcessesAtMyStart = bpmn.findByName("TaskExampleProcess");

    test.equal(foundProcessesAtMyStart.length, 2, "testFindByNameMatch");
    test.equal(foundProcessesAtMyStart[0]._implementation.processId, "p1", "testFindByNameMatch");

    test.done();
};

exports.testFindByNameNoMatch = function(test) {
    bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcessesAtMyStart = bpmn.findByName("TaskExampleProcessXXXX");

    test.equal(foundProcessesAtMyStart.length, 0, "testFindByNameNoMatch");

    test.done();
};

