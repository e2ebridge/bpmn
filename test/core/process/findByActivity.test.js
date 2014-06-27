/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var async = require('async');

var find = require('../../../lib/find.js');
var bpmn = require('../../../lib/public.js');

var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByStateEmpty = function(test) {
    var foundProcesses = find.findByState([]);

    test.equal(foundProcesses.length, 0, "testFindByStateEmpty");

    test.done();
};

exports.testFindByStateAll = function(test) {
    var processes = [];

    async.parallel([
        function(done){
            bpmn.createUnmanagedProcess(fileName,function(err, p){
                p.setProperty("myprop1", "gugus");
                p.triggerEvent("MyStart");
                processes.push(p);
                done();
            });
        },
        function(done){
            bpmn.createUnmanagedProcess(fileName,function(err, p){
                p.setProperty("myprop2", "blah");
                processes.push(p);
                done();
            });

        }
    ], function(){

        var foundProcesses = find.findByState(processes);

        test.equal(foundProcesses.length, 2, "testFindByStateAll");
        test.equal(foundProcesses[0]._implementation.properties.myprop1, "gugus", "testFindByStateAll");
        test.equal(foundProcesses[1]._implementation.properties.myprop2, "blah", "testFindByStateAll");

        test.done();
    });

};

exports.testFindByStateOneMatch = function(test) {
    var processes = [];

    async.parallel([
        function(done){
            bpmn.createUnmanagedProcess(fileName,function(err, p){
                p.setProperty("myprop1", "gugus");
                p.triggerEvent("MyStart");
                processes.push(p);
                done();
            });
        },
        function(done){
            bpmn.createUnmanagedProcess(fileName,function(err, p){
                p.setProperty("myprop2", "blah");
                processes.push(p);
                done();
            });

        }
    ], function(){

        var foundProcessesAtMyStart = find.findByState(processes, "MyTask");

        test.equal(foundProcessesAtMyStart.length, 1, "testFindByStateOneMatch");
        test.equal(foundProcessesAtMyStart[0].getProperty('myprop1'), "gugus", "testFindByStateOneMatch");

        test.done();
    });
};

