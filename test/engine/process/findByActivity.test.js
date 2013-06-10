/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var publicModule = require('../../../lib/public.js');

var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByState_Empty = function(test) {
    publicModule.clearCache();
    var foundProcesses = publicModule.findByState();

    test.equal(foundProcesses.length, 0, "testFindByState_Empty");

    test.done();
};

exports.testFindByState_All = function(test) {
    publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop2", "blah");

    var foundProcesses = publicModule.findByState();

    test.equal(foundProcesses.length, 2, "testFindByState_All");
    test.equal(foundProcesses[0]._implementation.data["myprop1"], "gugus", "testFindByState_OneMatch");
    test.equal(foundProcesses[1]._implementation.data["myprop2"], "blah", "testFindByState_OneMatch");

    test.done();
};

exports.testFindByState_OneMatch = function(test) {
    publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcessesAtMyStart = publicModule.findByState("MyTask");

    test.equal(foundProcessesAtMyStart.length, 1, "testFindByState_OneMatch");
    test.equal(foundProcessesAtMyStart[0]._implementation.processId, "p1", "testFindByState_OneMatch");

    test.done();
};

