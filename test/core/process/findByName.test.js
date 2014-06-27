/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var async = require('async');

var find = require('../../../lib/find');
var bpmn = require('../../../lib/public.js');

var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByNameEmpty = function(test) {
    var foundProcesses = find.findByName([]);

    test.equal(foundProcesses.length, 0, "testFindByNameEmpty");

    test.done();
};

exports.testFindByNameEmpty2 = function(test) {
    var processes = [];

    async.parallel([
        function(done){
            bpmn.createUnmanagedProcess( fileName,function(err, p){
                p.setProperty("myprop1", "gugus");
                p.triggerEvent("MyStart");
                processes.push(p);
                done();
            });
        },
        function(done){
            bpmn.createUnmanagedProcess( fileName,function(err, p){
                p.setProperty("myprop2", "blah");
                processes.push(p);
                done();
            });

        }
    ], function(){

        var foundProcesses = find.findByName(processes);

        test.equal(foundProcesses.length, 0, "testFindByNameEmpty2");

        test.done();
    });
};

exports.testFindByNameMatch = function(test) {
    var processes = [];

    async.parallel([
        function(done){
            bpmn.createUnmanagedProcess( fileName,function(err, p){
                p.setProperty("myprop1", "gugus");
                p.triggerEvent("MyStart");
                processes.push(p);
                done();
            });
        },
        function(done){
            bpmn.createUnmanagedProcess( fileName,function(err, p){
                p.setProperty("myprop2", "blah");
                processes.push(p);
                done();
            });

        }
    ], function(){

        var foundProcessesAtMyStart = find.findByName(processes, "TaskExampleProcess");

        test.equal(foundProcessesAtMyStart.length, 2, "testFindByNameMatch");
        test.equal(foundProcessesAtMyStart[0].getProperty('myprop1'), "gugus", "testFindByNameMatch");

        test.done();
    });
};

exports.testFindByNameNoMatch = function(test) {
    var processes = [];

    async.parallel([
        function(done){
            bpmn.createUnmanagedProcess( fileName,function(err, p){
                p.setProperty("myprop1", "gugus");
                p.triggerEvent("MyStart");
                processes.push(p);
                done();
            });
        },
        function(done){
            bpmn.createUnmanagedProcess( fileName,function(err, p){
                p.setProperty("myprop2", "blah");
                processes.push(p);
                done();
            });

        }
    ], function(){

        var foundProcessesAtMyStart = find.findByName(processes, "TaskExampleProcessXXXX");

        test.equal(foundProcessesAtMyStart.length, 0, "testFindByNameNoMatch");

        test.done();
    });
};

