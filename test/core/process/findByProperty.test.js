/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var bpmn = require('../../../lib/public.js');

var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByValueEmpty = function(test) {
    bpmn.clearCache();
    var foundProcesses = bpmn.findByProperty();

    test.equal(foundProcesses.length, 0, "testFindByValueEmpty");

    test.done();
};

exports.testFindByValueAll = function(test) {
     bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop2", "blah");

    var foundProcesses = bpmn.findByProperty();

    test.equal(foundProcesses.length, 2, "testFindByValueAll");
    test.equal(foundProcesses[0]._implementation.properties.myprop1, "gugus", "testFindByValueAll");
    test.equal(foundProcesses[1]._implementation.properties.myprop2, "blah", "testFindByValueAll");

    test.done();
};

exports.testFindByValueOneMatch = function(test) {
     bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcesses = bpmn.findByProperty({myprop1: "gugus"});

    test.equal(foundProcesses.length, 1, "testFindByValueOneMatch");
    test.equal(foundProcesses[0]._implementation.properties.myprop1, "gugus", "testFindByValueOneMatch");

    test.done();
};

