/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var bpmn = require('../../../lib/public.js');

var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByStateEmpty = function(test) {
    bpmn.clearCache();
    var foundProcesses = bpmn.findByState();

    test.equal(foundProcesses.length, 0, "testFindByStateEmpty");

    test.done();
};

exports.testFindByStateAll = function(test) {
    bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop2", "blah");

    var foundProcesses = bpmn.findByState();

    test.equal(foundProcesses.length, 2, "testFindByStateAll");
    test.equal(foundProcesses[0]._implementation.properties.myprop1, "gugus", "testFindByStateAll");
    test.equal(foundProcesses[1]._implementation.properties.myprop2, "blah", "testFindByStateAll");

    test.done();
};

exports.testFindByStateOneMatch = function(test) {
    bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcessesAtMyStart = bpmn.findByState("MyTask");

    test.equal(foundProcessesAtMyStart.length, 1, "testFindByStateOneMatch");
    test.equal(foundProcessesAtMyStart[0]._implementation.processId, "p1", "testFindByStateOneMatch");

    test.done();
};

