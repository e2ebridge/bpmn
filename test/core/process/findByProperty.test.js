/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var async = require('async');

var find = require('../../../lib/find');
var bpmn = require('../../../lib/public.js');

var fileName = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");

exports.testFindByValueEmpty = function(test) {
    bpmn.clearCache();
    var foundProcesses = find.findByProperty([]);

    test.equal(foundProcesses.length, 0, "testFindByValueEmpty");

    test.done();
};

exports.testFindByValueAll = function(test) {
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

        var foundProcesses = find.findByProperty(processes);

        test.equal(foundProcesses.length, 2, "testFindByValueAll");
        test.equal(foundProcesses[0].getProperty('myprop1'), "gugus", "testFindByValueAll");
        test.equal(foundProcesses[1].getProperty('myprop2'), "blah", "testFindByValueAll");

        test.done();
    });
};

exports.testFindByValueOneMatch = function(test) {
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

        var foundProcesses = find.findByProperty(processes, {myprop1: "gugus"});

        test.equal(foundProcesses.length, 1, "testFindByValueOneMatch");
        test.equal(foundProcesses[0].getProperty('myprop1'), "gugus", "testFindByValueOneMatch");

        test.done();
    });
};

