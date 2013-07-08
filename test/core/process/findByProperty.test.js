/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var bpmn = require('../../../lib/public.js');

var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByValue_Empty = function(test) {
    bpmn.clearCache();
    var foundProcesses = bpmn.findByProperty();

    test.equal(foundProcesses.length, 0, "testFindByValue_Empty");

    test.done();
};

exports.testFindByValue_All = function(test) {
     bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop2", "blah");

    var foundProcesses = bpmn.findByProperty();

    test.equal(foundProcesses.length, 2, "testFindByValue_All");
    test.equal(foundProcesses[0]._implementation.data["myprop1"], "gugus", "testFindByValue_OneMatch");
    test.equal(foundProcesses[1]._implementation.data["myprop2"], "blah", "testFindByValue_OneMatch");

    test.done();
};

exports.testFindByValue_OneMatch = function(test) {
     bpmn.clearCache();

    var p1 = bpmn.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = bpmn.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcesses = bpmn.findByProperty({myprop1: "gugus"});

    test.equal(foundProcesses.length, 1, "testFindByValue_OneMatch");
    test.equal(foundProcesses[0]._implementation.data["myprop1"], "gugus", "testFindByValue_OneMatch");

    test.done();
};

