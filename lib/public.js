/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var async = require('async');

var definitions = require('./parsing/definitions.js');
var handlers = require('./handler.js');
var bpmnProcesses = require('./process.js');
var logger = require('./logger.js');
var rest = require('./rest.js');

var Persistency = require('./persistency/persistency.js').Persistency;

/**
 * @param {{processName: string}} url2FileMap Contains for each process name occurring in the URL the BPMN file path
 * @param restifyOptions
 * @returns {*}
 */
exports.createServer = rest.createServer;

/**
 * @param {Object} query The query is an object that is being matched to the data.
 * @returns {Array.<BPMNProcess>}
 */
exports.findByProperty = bpmnProcesses.findByProperty;

/**
 * @param {String} activityName
 * @returns {Array.<BPMNProcessClient>}
 */
exports.findByState = bpmnProcesses.findByState;

/**
 * @param {String} taskName
 * @returns {Array.<BPMNProcessClient>}
 */
exports.findByTask = bpmnProcesses.findByState;

/**
 * @param {String} eventName
 * @returns {Array.<BPMNProcessClient>}
 */
exports.findByEvent = bpmnProcesses.findByState;

/**
 * @param {String} processName
 * @returns {Array.<BPMNProcessClient>}
 */
exports.findByName = bpmnProcesses.findByName;

/**
 * @param {String} processId
 * @returns {BPMNProcessClient}
 */
exports.getById = bpmnProcesses.getById;

exports.clearCache = function() {
    definitions.clearCache();
};

exports.logLevels = logger.logLevels;

/**
 * A BPMN process having a given processId is created and it's state is loaded if it has been persisted.
 * The doneLoading and doneSaving handler are called after a process has been loaded respectively saved
 * and BEFORE deferred events are emitted.
 * If these handlers are not given, we try to find a "doneLoadingHandler" respectively "doneSavingHandler"
 * in the process event handler file.
 *
 * @param {String} processId
 * @param {String} bpmnFilePath Full qualified file name of the bpmn file to be loaded
 * @param {{uri: String, doneLoading: Function, doneSaving: Function}=} persistencyOptions
 * @param {Function=} callback
 * @return {BPMNProcessClient}
 */
exports.createProcess = function(processId, bpmnFilePath, persistencyOptions, callback) {
    var processDefinition, error;
    var processDefinitions = definitions.getBPMNProcessDefinitions(bpmnFilePath);

    if(typeof persistencyOptions === 'function'){
        callback = persistencyOptions;
        persistencyOptions = null;
    }

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

    createProcess(processId, bpmnFilePath, processDefinition, persistencyOptions, function(err, bpmnProcess){
        if(!callback){
            return;
        }

        callback(err, bpmnProcess.processClient);
    });

};

/**
 * An array of BPMN processes having a given processId are created and their state is loaded if it has been persisted.
 * The doneLoading and doneSaving handler are called after a process has been loaded respectively saved
 * and BEFORE deferred events are emitted.
 * If these handlers are not given, we try to find a "doneLoadingHandler" respectively "doneSavingHandler"
 * in the process event handler file.
 *
 * @param {Array.<{name: String, id: String}>} processDescriptors
 * @param {String} bpmnFilePath Full qualified file name of the bpmn file to be loaded
 * @param {{uri: String, doneLoading: Function, doneSaving: Function}=} persistencyOptions
 * @param {Function=} callback
 * @return {Array.<BPMNProcessClient>}
 */
exports.createCollaboratingProcesses = function(processDescriptors, bpmnFilePath, persistencyOptions, callback) {
    var processes = {};
    var processDefinitions = definitions.getBPMNProcessDefinitions(bpmnFilePath);

    if(typeof persistencyOptions === 'function'){
        callback = persistencyOptions;
        persistencyOptions = null;
    }

    async.eachSeries(processDefinitions, function(processDefinition, done) {
        var processId;

        try {
            processId = getProcessId(processDescriptors, processDefinition.name, bpmnFilePath);
        }catch(error){
            done(error);
        }

        createProcess(processId, bpmnFilePath, processDefinition, persistencyOptions, function(err, bpmnProcess){
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

function getProcessId(processDescriptors, processName, bpmnFilePath) {
    var result;
    var results = processDescriptors.filter(function(processId) {
        return (processId.name === processName);
    });

    if (results.length === 1) {
        result = results[0].id;
    } else {
        if (results.length === 0) {
            throw new Error("Could not find the process pool '" + processName + "' in the process definitions file '" + bpmnFilePath + "'");
        } else {
            throw new Error("Found more than one process pool '" + processName + "' in the process definitions file '" + bpmnFilePath + "'");
        }
    }

    return result;
}

function createProcess(processId, bpmnFilePath, processDefinition, persistencyOptions, callback) {
    var handler = handlers.getHandlerFromFile(bpmnFilePath);
    var persistency = null;

    if(typeof persistencyOptions === 'function'){
        callback = persistencyOptions;
        persistencyOptions = null;
    }

    if (persistencyOptions) {
        persistency =  new Persistency(persistencyOptions);
        handler.doneLoadingHandler = persistencyOptions.doneLoading || handler.doneLoadingHandler;
        handler.doneSavingHandler = persistencyOptions.doneSaving || handler.doneSavingHandler;
    }

    return bpmnProcesses.createBPMNProcess(processId, processDefinition, handler, persistency, callback);
}


