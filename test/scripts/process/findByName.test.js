/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var publicModule = require('../../../lib/public.js');

var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByName_Empty = function(test) {
    publicModule.clearCache();
    var foundProcesses = publicModule.findByName();

    test.equal(foundProcesses.length, 0, "testFindByName_Empty");

    test.done();
};

exports.testFindByName_Empty2 = function(test) {
    publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop2", "blah");

    var foundProcesses = publicModule.findByName();

    test.equal(foundProcesses.length, 0, "testFindByName_Empty2");

    test.done();
};

exports.testFindByName_Match = function(test) {
    publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcessesAtMyStart = publicModule.findByName("TaskExampleProcess");

    test.equal(foundProcessesAtMyStart.length, 2, "testFindByName_Match");
    test.equal(foundProcessesAtMyStart[0]._implementation.processId, "p1", "testFindByName_Match");

    test.done();
};

exports.testFindByName_NoMatch = function(test) {
    publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcessesAtMyStart = publicModule.findByName("TaskExampleProcessXXXX");

    test.equal(foundProcessesAtMyStart.length, 0, "testFindByName_NoMatch");

    test.done();
};

