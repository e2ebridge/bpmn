/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var publicModule = require('../../../lib/public.js');

var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByValue_Empty = function(test) {
    publicModule.clearCache();
    var foundProcesses = publicModule.findByProperty();

    test.equal(foundProcesses.length, 0, "testFindByValue_Empty");

    test.done();
};

exports.testFindByValue_All = function(test) {
     publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop2", "blah");

    var foundProcesses = publicModule.findByProperty();

    test.equal(foundProcesses.length, 2, "testFindByValue_All");
    test.equal(foundProcesses[0]._implementation.data["myprop1"], "gugus", "testFindByValue_OneMatch");
    test.equal(foundProcesses[1]._implementation.data["myprop2"], "blah", "testFindByValue_OneMatch");

    test.done();
};

exports.testFindByValue_OneMatch = function(test) {
     publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcesses = publicModule.findByProperty({myprop1: "gugus"});

    test.equal(foundProcesses.length, 1, "testFindByValue_OneMatch");
    test.equal(foundProcesses[0]._implementation.data["myprop1"], "gugus", "testFindByValue_OneMatch");

    test.done();
};

