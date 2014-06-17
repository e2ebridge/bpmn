/**
 * Copyright: E2E Technologies Ltd
 * Author: Cyril Schmitt <cschmitt@e2ebridge.com>
 */
"use strict";

var async = require('async');
var util = require('util');

var definitions = require('./parsing/definitions');
var handlers = require('./handler');
var Persistency = require('./persistency/persistency').Persistency;
var createBPMNProcess = require('./process').createBPMNProcess;
var find = require('./find');
var rest = require('./rest');

/**
 * @param {{
 *      bpmnFilePath: String|Array.<String>=,
 *      handlerFilePath: {name: String, filePath: String}|Array.<{name: String, filePath: String}>=,
 *      handler: {name: String, module: Object}|Array.<{name: String, module: Object}>=,
 *      persistencyOptions: {uri: String, doneLoading: Function, doneSaving: Function}=
 *  }} options
 * @constructor
 */
var ProcessManager = exports.ProcessManager = function(options){
    var self = this;

    options = options || {};

    self._processCache = {};

    self._initialized = true;
    self._initialising = false;
    self._initializationError = null;
    self._definitionsToInitialize = [];
    self._initialiseCallbacks = [];

    self._persistency = null;
    if (options.persistencyOptions) {
        self._persistency =  new Persistency(options.persistencyOptions);
        self._doneLoadingHandler = options.persistencyOptions.doneLoading;
        self._doneSavingHandler = options.persistencyOptions.doneSaving;
    }

    self._processHandlers = {};
    self._processDefinitions = {};


    if(!options.handlerFilePath){
        options.handlerFilePath = [];
    }

    if(!util.isArray(options.handlerFilePath)){
        options.handlerFilePath = [options.handlerFilePath];
    }

    options.handlerFilePath.forEach(function(handlerDescriptor){
        if(!handlerDescriptor.name || !handlerDescriptor.filePath){
            throw new Error("handlerFilePath needs a name and a filePath");
        }

        self.addHandlerFilePath(handlerDescriptor.name, handlerDescriptor.filePath);
    });


    if(!options.handler){
        options.handler = [];
    }

    if(!util.isArray(options.handler)){
        options.handler = [options.handler];
    }

    options.handler.forEach(function(handlerDescriptor){
        if(!handlerDescriptor.name || !handlerDescriptor.module){
            throw new Error("handler needs a name and a module");
        }

        self.addHandler(handlerDescriptor.name, handlerDescriptor.module);
    });

    if(!options.handlerString){
        options.handlerString = [];
    }

    if(!util.isArray(options.handlerString)){
        options.handlerString = [options.handlerString];
    }

    options.handlerString.forEach(function(handlerString){
        if(!handlerString.name || !handlerString.string){
            throw new Error("handlerString needs a name and a string");
        }

        self.addHandlerString(handlerString.name, handlerString.string);
    });


    if(!options.bpmnFilePath){
        options.bpmnFilePath = [];
    }

    if(!util.isArray(options.bpmnFilePath)){
        options.bpmnFilePath = [options.bpmnFilePath];
    }

    options.bpmnFilePath.forEach(function(filePath){
        self.addBpmnFilePath(filePath);
    });


    if(!options.bpmnXML){
        options.bpmnXML = [];
    }

    if(!util.isArray(options.bpmnXML)){
        options.bpmnXML = [options.bpmnXML];
    }

    options.bpmnXML.forEach(function(bpmnXML){
        if(!bpmnXML.name || !bpmnXML.xml){
            throw new Error("bpmnXML needs a name and a xml");
        }

        self.addBpmnXML(bpmnXML.xml, bpmnXML.name);
    });
};

/**
 * Initialise a new definition by loading all persisted process.
 * All other function that need the initialise state will wait until initialization is done.
 *
 * @param {BPMNProcessDefinition} processDefinition
 * @private
 */
ProcessManager.prototype._initialiseDefinition = function(processDefinition){
    var self = this;

    self._initializationError = null;
    self._initialized = false;

    self._definitionsToInitialize.push(processDefinition);

    if(!self._initialising){    // if already initialising we don't call next, the definition will be initialised after current one.
        next();
    }

    /**
     * Called after all initializations are done.
     * @param err
     */
    function execCallbacks(err){
        self._definitionsToInitialize = [];

        self._initializationError = err;
        self._initialized = true;
        self._initialising = false;

        self._initialiseCallbacks.forEach(function(callback){   // call all waiting callbacks
            callback(err);
        });
    }

    function next(){
        self._initialising = true;

        if(self._definitionsToInitialize.length === 0){     // if all definitions have been initialized
            return execCallbacks();
        }

        var currentDefinition = self._definitionsToInitialize.pop();    // get the next definition

        if(self._processDefinitions[currentDefinition.name] ||      // if the definition already exist it means the processes were already loaded
                !self._persistency){                                // if there is no persistency nothing needs to be loaded

            self._processDefinitions[currentDefinition.name] = currentDefinition;   // we simply add or replace the definition
            return next();
        }


        self._persistency.loadAll(currentDefinition.name, function(err, documents){     // load all saved document

            if(err){
                execCallbacks(err);
                return;
            }

            self._processDefinitions[currentDefinition.name] = currentDefinition;

            async.each(documents, function(document, done){                                                         // for each persisted document found

                self._createSingleProcess(document.processId, currentDefinition.name, function(err, bpmnProcess){       // create the process
                    if(err){
                        return done(err);
                    }

                    if(self._processCache[bpmnProcess.getProcessId()]){                  // check if id already used
                        return done(new Error('duplicated id in persisted data'));
                    }

                    self._processCache[bpmnProcess.getProcessId()] = bpmnProcess;
                    done();
                });

            }, function(err){
                if(err){
                    return execCallbacks(err);
                }

                next();
            });

        });

    }

};

/**
 * The callback will be called after initialized
 *
 * @param callback
 * @private
 */
ProcessManager.prototype._afterInitialization = function(callback){
    if(this._initialized){
        return callback(this._initializationError);
    }

    this._initialiseCallbacks.push(callback);
};

/**
 * Change the process handler using a file.
 *
 * @param {String} name Name of the process
 * @param {String} handlerFilePath
 */
ProcessManager.prototype.addHandlerFilePath = function(name, handlerFilePath){
    this._processHandlers[name] = handlers.getHandlerFromFile(handlerFilePath);
    this._processHandlers[name].doneLoadingHandler = this._doneLoadingHandler || this._processHandlers[name].doneLoadingHandler;
    this._processHandlers[name].doneSavingHandler = this._doneSavingHandler || this._processHandlers[name].doneSavingHandler;
};

/**
 * Change the process handler using a string.
 *
 * @param {String} name Name of the process
 * @param {String} handlerString
 */
ProcessManager.prototype.addHandlerString = function(name, handlerString){
    this._processHandlers[name] = handlers.getHandlerFromString(handlerString);
    this._processHandlers[name].doneLoadingHandler = this._doneLoadingHandler || this._processHandlers[name].doneLoadingHandler;
    this._processHandlers[name].doneSavingHandler = this._doneSavingHandler || this._processHandlers[name].doneSavingHandler;
};

/**
 * Change the process handler using an object.
 *
 * @param {String} name Name of the process.
 * @param {String} handler
 */
ProcessManager.prototype.addHandler = function(name, handler){
    this._processHandlers[name] = handler;
    this._processHandlers[name].doneLoadingHandler = this._doneLoadingHandler || this._processHandlers[name].doneLoadingHandler;
    this._processHandlers[name].doneSavingHandler = this._doneSavingHandler || this._processHandlers[name].doneSavingHandler;
};

/**
 * Add a bpmn file to the manager.
 * All process definition found in this file will be initialized and replace the old ones if exists.
 * A process handler object or file path can be passed. If none passed the same file path as the bpmn is used or the existing handler.
 * An error is thrown if no handler is found.
 *
 * @param {String} bpmnFilePath
 * @param {Object|String} processHandler
 */
ProcessManager.prototype.addBpmnFilePath = function(bpmnFilePath, processHandler){
    var self = this;
    var processDefinitions;

    if(typeof processHandler === 'string'){
        processHandler = handlers.getHandlerFromFile(processHandler);
    }

    if(!processHandler){
        try{
            processHandler = handlers.getHandlerFromFile(bpmnFilePath);
            processHandler.doneLoadingHandler = self._doneLoadingHandler;
            processHandler.doneSavingHandler = self._doneSavingHandler;
        }catch(err){}
    }

    processDefinitions = definitions.getBPMNProcessDefinitions(bpmnFilePath);

    processDefinitions.forEach(function(processDefinition){

        if(processHandler) {
            self._processHandlers[processDefinition.name] = processHandler;
        } else if(!self._processHandlers[processDefinition.name]){
            throw new Error('No process handler defined for process "'+processDefinition.name+'". The process handler must be defined before the process or with the process.');
        }

        self._initialiseDefinition(processDefinition);
    });
};

/**
 * Add a bpmn XML to the manager.
 * All process definition found in this file will be initialized and replace the old ones if exists.
 * A process handler object or file path can be passed. If none passed the same file path as the bpmn is used or the existing handler.
 * An error is thrown if no handler is found.
 *
 * @param {String} bpmnXml
 * @param {String=} processName
 * @param {Object|String=} processHandler
 */
ProcessManager.prototype.addBpmnXML = function(bpmnXml, processName, processHandler){
    var self = this;
    var processDefinitions;

    if(typeof processHandler === 'string'){
        processHandler = handlers.getHandlerFromString(processHandler);
    }

    processDefinitions = definitions.getBPMNDefinitionsFromXML(bpmnXml, processName);

    processDefinitions.forEach(function(processDefinition){

        if(processHandler) {
            self._processHandlers[processDefinition.name] = processHandler;
        } else if(!self._processHandlers[processDefinition.name]){
            throw new Error('No process handler defined for process "'+processDefinition.name+'". The process handler must be defined before the process or with the process.');
        }

        self._initialiseDefinition(processDefinition);
    });
};


/**
 * @param {String} processId
 * @param {Function} callback
 */
ProcessManager.prototype.get = function get(processId, callback) {
    var self = this;

    this._afterInitialization(function(err){
        if(callback){
            callback(err, self._processCache[processId]);
        }
    });
};

/**
 * @param {String} processId
 * @param {String} processName
 * @param {Function} callback
 */
ProcessManager.prototype._createSingleProcess = function(processId, processName, callback){
    createBPMNProcess(processId, this._processDefinitions[processName], this._processHandlers[processName], this._persistency, function(err, bpmnProcess){
        callback(err, bpmnProcess);
    });
};

/**
 * @param {Array.<{name: String, id: String}>} processDescriptors
 * @param {Function} callback
 * @return {Array.<BPMNProcessClient>}
 */
ProcessManager.prototype._createCollaboratingProcesses = function(processDescriptors, callback) {
    var self = this;
    var processes = {};

    async.eachSeries(processDescriptors, function(processDescriptor, done) {

        self._createSingleProcess(processDescriptor.id, processDescriptor.name, function(err, bpmnProcess){
            if(err){
                done(err);
            }
            processes[processDescriptor.name] = bpmnProcess;
            done();
        });

    }, function(err){
        var results = [];

        Object.keys(processes).forEach(function(name){
            var bpmnProcess = processes[name];

            var participants = bpmnProcess.getProcessDefinition().getCollaboratingParticipants();

            participants.forEach(function (participant) {
                bpmnProcess.addParticipant(participant.name, processes[participant.name]);
            });

            results.push(bpmnProcess);
        });

        callback(err, results);
    });
};

/**
 * A BPMN process is created using the descriptor name and id, it's state is loaded if it has been persisted.
 * A simple id can be passed if there is only one process definition.
 * If there are multiple definitions, an array of descriptors can be passed and an array of collaborating BPMN processes is created.
 * The processId parameter needs to correspond.
 *
 * @param {String|{name: String, id: String}|Array.<{name: String, id: String}>} descriptors
 * @param {Function} callback
 */
ProcessManager.prototype.createProcess = function(descriptors, callback) {
    var self = this;

    this._afterInitialization(function(err){
        if(err){
            return callback(err);
        }

        if (typeof descriptors === 'string' && Object.keys(self._processDefinitions).length !== 1) {
            return callback(new Error("The manager contains more than one process definition. " +
                "processId have to be an Array.<{name: String, id: String}>} "));
        }

        if(util.isArray(descriptors)) {
            descriptors.forEach(function(descriptor){             // check if one of the ids is already used
                if(self._processCache[descriptor.id]){
                    err = new Error('id already used');
                }
            });
            if(err){
                return callback(err);
            }

            self._createCollaboratingProcesses(descriptors, function(err, bpmnProcesses){
                if(err){
                    return callback(err);
                }

                descriptors.forEach(function(descriptor){             // check if one of the ids is already used
                    if(self._processCache[descriptor.id]){          // again because a process could have been created in between
                        err = new Error('id already used');
                    }
                });
                if(err){
                    return callback(err);
                }

                callback(null, bpmnProcesses.map(function(bpmnProcess){
                    self._processCache[bpmnProcess.getProcessId()] = bpmnProcess;
                    return bpmnProcess.processClient;
                }));
            });

            return;
        }

        if(typeof descriptors === 'string') {
            descriptors = {
                id: descriptors,
                name: Object.keys(self._processDefinitions)[0]
            };
        }

        if(self._processCache[descriptors.id]){                                        // check if id already used
            return callback(new Error('id already used'));
        }

        self._createSingleProcess(descriptors.id, descriptors.name, function(err, bpmnProcess){
            if(err){
                return callback(err);
            }

            if(self._processCache[descriptors.id]){                                      // check if id already used
                return callback(new Error('id already used'));                      // again because a process could have been created in between
            }

            self._processCache[descriptors.id] = bpmnProcess;
            callback(null, bpmnProcess.processClient);
        });
    });
};

/**
 * @param {Function} callback
 */
ProcessManager.prototype._getAllProcesses = function(callback) {
    var self = this;
    var allProcessIds = Object.keys(this._processCache);

    if(!callback){
        return;
    }

    callback(null, allProcessIds.map(function(loadedProcessId) {
        return self._processCache[loadedProcessId];
    }));
};

/**
 * @param {Function} callback
 */
ProcessManager.prototype.getAllProcesses = function(callback) {
    var self = this;

    if(!callback){
        return;
    }


    this._afterInitialization(function(err){
        if (err) {
            return callback(err);
        }

        self._getAllProcesses(function (err, bpmnProcesses) {
            if (err) {
                return callback(err);
            }

            callback(null, bpmnProcesses.map(function (bpmnProcess) {
                return bpmnProcess.processClient;
            }));
        });
    });
};

/**
 * Returns all processes where the current task, activity, or event name equals the given state name
 * @param {String} stateName.
 * @param {Function} callback
 */
ProcessManager.prototype.findByState = function(stateName, callback) {
    var self = this;

    if(!callback){
        return;
    }

    this._afterInitialization(function(err){
        if (err) {
            return callback(err);
        }

        self.getAllProcesses(function (err, bpmnProcesses) {
            if (err) {
                return callback(err);
            }

            callback(null, find.findByState(bpmnProcesses, stateName));
        });
    });
};

/**
 * @param {Object} query The query is an object that is being matched to the data.
 * @param {Function} callback
 */
ProcessManager.prototype.findByProperty = function(query, callback) {
    var self = this;

    if(!callback){
        return;
    }

    this._afterInitialization(function(err){
        if (err) {
            return callback(err);
        }

        self.getAllProcesses(function (err, bpmnProcesses) {
            if (err) {
                return callback(err);
            }

            callback(null, find.findByProperty(bpmnProcesses, query));
        });
    });
};


/**
 * @param {String} processName
 * @param {Boolean=} caseSensitive
 * @param {Function} callback
 */
ProcessManager.prototype.findByName = function(processName, caseSensitive, callback) {
    var self = this;

    if(typeof caseSensitive === 'function'){
        callback = caseSensitive;
        caseSensitive = true;
    }

    if(!callback){
        return;
    }

    this._afterInitialization(function(err){
        if (err) {
            return callback(err);
        }

        self.getAllProcesses(function (err, bpmnProcesses) {
            if (err) {
                return callback(err);
            }

            callback(null, find.findByName(bpmnProcesses, processName, caseSensitive));
        });
    });
};

/**
 *
 * @param {Function} callback
 */
ProcessManager.prototype.getDefinitionNames = function(callback){
    var self = this;

    this._afterInitialization(function(err){
        callback(err, Object.keys(self._processDefinitions));
    });
};


/**
 * Creates a REST server based on the restify framework. It takes two parameters, options and restifyOptions.
 *      options: optional object having the following optional properties
 *          createProcessId: Function that returns a UUID. Default: node-uuid.v1()
 *          logLevel: used log level. Default: Error. Use logger.logLevels to set.
 *      restifyOptions: these options are given to the restify.createServer call.
 *                      If not given, the log property is set to the internal winston logger and
 *                      the name property is set to 'bpmnRESTServer'
 * @param {{createProcessId: function, logLevel: logger.logLevels}=} options
 * @param {Object=} restifyOptions
 * @returns {*}
 */
ProcessManager.prototype.createServer = function(options, restifyOptions){
    return rest.createServer(this,  options, restifyOptions);
};