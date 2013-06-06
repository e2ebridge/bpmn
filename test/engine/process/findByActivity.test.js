/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var publicModule = require('../../../lib/public.js');

var fileName = pathModule.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByActivity_Empty = function(test) {
    publicModule.clearCache();
    var foundProcesses = publicModule.findByActivity();

    test.equal(foundProcesses.length, 0, "testFindByActivity_Empty");

    test.done();
};

exports.testFindByActivity_All = function(test) {
    publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop2", "blah");

    var foundProcesses = publicModule.findByActivity();

    test.equal(foundProcesses.length, 2, "testFindByActivity_All");
    test.equal(foundProcesses[0]._implementation.data["myprop1"], "gugus", "testFindByActivity_OneMatch");
    test.equal(foundProcesses[1]._implementation.data["myprop2"], "blah", "testFindByActivity_OneMatch");

    test.done();
};

exports.testFindByActivity_OneMatch = function(test) {
    publicModule.clearCache();

    var p1 = publicModule.createProcess("p1", fileName);
    p1.setProperty("myprop1", "gugus");
    p1.triggerEvent("MyStart");

    var p2 = publicModule.createProcess("p2", fileName);
    p2.setProperty("myprop1", "blah");

    var foundProcessesAtMyStart = publicModule.findByActivity("MyTask");

    test.equal(foundProcessesAtMyStart.length, 1, "testFindByActivity_OneMatch");
    test.equal(foundProcessesAtMyStart[0]._implementation.processId, "p1", "testFindByActivity_OneMatch");

    test.done();
};

