/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var async = require('async');

var definitions = require('./parsing/definitions.js');
var handlers = require('./handler.js');
var bpmnProcesses = require('./process.js');
var logger = require('./logger.js');


var ProcessManager = require('./manager').ProcessManager;

module.exports = exports = new ProcessManager();

exports.ProcessManager = ProcessManager;

exports.clearCache = function() {
    definitions.clearCache();
};

exports.logLevels = logger.logLevels;

/**
 * A BPMN process is created.
 *
 * @param {String} bpmnFilePath Full qualified file name of the bpmn file to be loaded
 * @param {Function=} callback
 * @return {BPMNProcessClient}
 */
exports.createStandaloneProcess = function(bpmnFilePath, callback) {
    var processDefinition, error;
    var processDefinitions = definitions.getBPMNProcessDefinitions(bpmnFilePath);

    if (processDefinitions.length === 1) {
        processDefinition = processDefinitions[0];
    } else {
        error = new Error("The BPMN file '" + bpmnFilePath + "'. contains more than one process definition. Use 'createCollaboratingProcesses' instead of 'createProcess'");
        if(!callback) {
            throw error;
        } else {
            callback(error);
        }
    }

    createStandaloneProcess(bpmnFilePath, processDefinition, function(err, bpmnProcess){
        if(!callback){
            return;
        }

        callback(err, bpmnProcess.processClient);
    });

};

/**
 * An array of BPMN processes are created.
 *
 * @param {String} bpmnFilePath Full qualified file name of the bpmn file to be loaded
 * @param {Function=} callback
 */
exports.createStandaloneCollaboratingProcesses = function(bpmnFilePath, callback) {
    var processes = {};
    var processDefinitions = definitions.getBPMNProcessDefinitions(bpmnFilePath);

    async.eachSeries(processDefinitions, function(processDefinition, done) {

        createStandaloneProcess(bpmnFilePath, processDefinition, function(err, bpmnProcess){
            if(err){
                done(err);
            }
            processes[processDefinition.name] = bpmnProcess;
            done();
        });
    }, function(err){
        var clients = [];

        Object.keys(processes).forEach(function(name){
            var bpmnProcess = processes[name];

            var participants = bpmnProcess.getProcessDefinition().getCollaboratingParticipants();

            participants.forEach(function (participant) {
                bpmnProcess.addParticipant(participant.name, processes[participant.name]);
            });

            clients.push(bpmnProcess.processClient);
        });

        callback(err, clients);
    });
};

/**
 * Maps bpmn names to valid handler names.
 * @param {String} bpmnName
 * @type {String}
 */
exports.mapName2HandlerName = function(bpmnName) {
    return handlers.mapName2HandlerName(bpmnName);
};

/**
 * Loads, parses, and validates BPMN definitions from bpmnFilePath
 * If validation error occur, an exception of type BPMNParseErrorQueue is thrown.
 * @param {String} bpmnFilePath
 * @param {Boolean=} cache If true, the definitions are cached.
 * @return {Array.<BPMNProcessDefinition|BPMNCollaborationDefinition>}
 */
exports.getBPMNDefinitions = function(bpmnFilePath, cache) {
    var bpmnDefinitions = null;
    if (cache) {
        bpmnDefinitions = definitions.getCachedBPMNDefinitions(bpmnFilePath);
    } else {
        bpmnDefinitions = definitions.getBPMNDefinitions(bpmnFilePath);
    }
    return bpmnDefinitions;
};


function createStandaloneProcess(bpmnFilePath, processDefinition, callback) {
    var handler = handlers.getHandlerFromFile(bpmnFilePath);

    return bpmnProcesses.createBPMNProcess(null, processDefinition, handler, callback);
}


