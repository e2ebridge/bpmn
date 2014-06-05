/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmn = require("./public.js");
var log = require('./logger');
var restify = require('restify');
var uuid = require('node-uuid');
var querystring = require('querystring');
//var bunyan2winston = require("./utils/bunyan2winston");


var transactionLog = require('e2e-transaction-logger');
try {
    transactionLog = require('e2e-transaction-logger');
}catch(err){
    transactionLog = null;
}

var receivedMessageIds = {};

exports.clearReceivedMessageIds = function() {
    receivedMessageIds = {};
};

var reservedQueryNames = {
    "state": "state"
};

/**
 * @api {post} /:processName Create process
 * @apiName CreateProcess
 * @apiGroup BPMN
 *
 * @apiDescription Creates a process but does not start it. To do this either send a message
 *                  or use CreateAndStartProcess.
 *
 * @apiDescription {String} processName Name of the process as used in the BPMN model
 */
var createProcessRoute = '/:processName';

/**
 * @api {post} /:processName/:startEventName Create and start process
 * @apiName CreateAndStartProcess
 * @apiGroup BPMN
 *
 * @apiDescription Creates a process and then triggers immediately the start event.
 *
 * @apiParam {String} processName Name of the process as used in the BPMN model
 * @apiParam {String} startEventName Event name as used in the BPMN model for starting this process
 */
var createAndStartProcessRoute = '/:processName/:startEventName';

/**
 * @api {get} /:processName/:id Get process instance
 * @apiName GetProcess
 * @apiGroup BPMN
 *
 * @apiDescription Returns the process state.
 *
 * @apiParam {String} processName Name of the process as used in the BPMN model
 * @apiParam {String} id Unique id of the process instance
 */
var getProcessRoute = '/:processName/:id';

/**
 * @api {get} /:processName/[?query]    Get process instances
 * @apiName GetProcesses
 * @apiGroup BPMN
 *
 * @apiDescription Get process instances.
 *                 The query strings accesses process properties.
 *
 * @apiParam {String} processName Name of the process as used in the BPMN model
 */
var getProcessesRoute = '/:processName';

/**
 * @api {put} /:processName/:id/:messageName/:messageId Send messages or trigger events.
 *
 * @apiName SendMessage
 * @apiGroup BPMN
 *
 * @apiDescription The messageId is used to make this call idempotent.
 *                 If the messageId is received the first time, a message is being created and
 *                 sent to the process and the status code 201 (Created) is returned.
 *                 For all subsequent request having the same URI the message is thrown away and
 *                 the status code 200 is returned.
 *
 * @apiParam {String} processName Name of the process as used in the BPMN model
 * @apiParam {String} id Unique id of the process instance
 * @apiParam {String} messageName Message or event name as used in the BPMN model for messages respectively event elements
 * @apiParam {String} messageId This id is used to implement idempotency.
 *
 */
var sendMessageRoute = '/:processName/:id/:messageName/:messageId';

/**
 * Creates a REST server based on the restify framework. It takes two parameters, options and restifyOptions.
 *      options: optional object having the following optional properties
 *          urlMap: Contains for each process name occurring in the URL the BPMN file path. If not given, the file name is derived by process name + '.bpmn'
 *          createProcessId: Function that returns a UUID. Default: node-uuid.v1()
 *          logLevel: used log level. Default: Error. Use logger.logLevels to set.
 *      restifyOptions: these options are given to the restify.createServer call.
 *                      If not given, the log property is set to the internal winston logger and
 *                      the name property is set to 'bpmnRESTServer'
 * @param {{urlMap: {processName: string}, createProcessId: function, logLevel: logger.logLevels}} options
 * @param {Object=} restifyOptions
 * @returns {*}
 */
exports.createServer = function(options, restifyOptions) {
    var logger, serverOptions, server;
    var settings = options || {};

    settings.urlMap = settings.urlMap || {};
    settings.createProcessId = settings.createProcessId || uuid.v1;

    logger = new log.Logger(null, settings);
    serverOptions = restifyOptions || {};
    serverOptions.name = serverOptions.name || "BPMNProcessServer";

    // Shimming the log doesn't work as expected: I cannot switch it off for example.
    // Additionally, the log format is horrible. So for the time being we use our own logging
    // serverOptions.log = serverOptions.log || bunyan2winston.createLogger(logger.winstonLogger);

    server = restify.createServer(serverOptions);

    server.use(restify.queryParser({ mapParams: false }));
    server.use(restify.bodyParser({ mapParams: false }));
    server.on('after', function( request, response, route, error) {
        var handler = options.onServerAfterEvent || onServerAfterEvent;
        handler(logger, request, response, route, error);
    });

    server.get(getProcessRoute,
        transactionLog.transactionLoggerMiddleware({
                name: function(req){
                    return 'GET ' + req.params.processName + ' process';
                }
            }),
        getProcess);
    server.get(getProcessesRoute,
        transactionLog.transactionLoggerMiddleware({
            name: function(req){
                return 'GET ' + req.params.processName + ' processes';
            }
        }),
        getProcesses);
    server.put(sendMessageRoute,
        transactionLog.transactionLoggerMiddleware({
            name: function(req){
                return 'PUT ' + req.params.messageName + ' message to ' + req.params.processName + ' process';
            }
        }),
        function(req, res, next) {
            sendMessage(logger, req, res, next);
        }
    );
    server.post(createProcessRoute,
        transactionLog.transactionLoggerMiddleware({
            name: function(req){
                return 'POST create ' + req.params.processName + ' process';
            }
        }),
        function(req, res, next) {
            createProcess(settings, logger, req, res, next);
}
    );
    server.post(createAndStartProcessRoute,
        transactionLog.transactionLoggerMiddleware({
            name: function(req){
                return 'POST create and start ' + req.params.processName + ' process';
            }
        }),
        function(req, res, next) {
            createAndStartProcess(settings, logger, req, res, next);
        }
    );

    return server;
};

function createProcess(settings, logger, req, res, next) {
    createAndStartProcess(settings, logger, req, res, next, false);
}

function createAndStartProcess(options, logger, req, res, next, startProcess) {
    var urlMap, processId, processName, bpmnFile, processNameFromDefinition, startEventName;

    try {
        urlMap = options.urlMap;
        processId = options.createProcessId();
        processName = querystring.unescape(req.params.processName);
        bpmnFile = getFileNameByProcessName(urlMap, processName);

        if (bpmnFile) {
            bpmn.createProcess(processId, bpmnFile, options.persistency, function(err, bpmnProcess){
                if(err){
                    return sendError(err, next);
                }

                logger.setProcess(bpmnProcess);

                processNameFromDefinition = bpmnProcess.getProcessDefinition().name;
                if (processName.toLowerCase() !== processNameFromDefinition.toLowerCase()) {
                    // NOTE: If we don't enforce this, it becomes more complicated to query by process name because it
                    // will then differ from the name in the url which might be confusing
                    return next(new restify.InvalidArgumentError("Did find process '" + processNameFromDefinition +
                        "' but not the process name '" + processName +
                        "' in the associated BPMN file '" + bpmnFile + "'"));
                }

                if (startProcess === undefined || startProcess) {
                    startEventName = querystring.unescape(req.params.startEventName);
                    triggerEvent(bpmnProcess, logger, startEventName, req.body, true);
                }

                res.send(201, getProcessResponse(bpmnProcess));
                return next();

            });

        } else {
            return next(new restify.InvalidArgumentError("Could not map process name '" + processName + "' to BPMN file."));
        }
    } catch (e) {
        return sendError(e, next);
    }
}


function getProcess(req, res, next) {
    var processId, bpmnProcess;

    try {
        processId = getParameter(req, "id");
        bpmnProcess = bpmn.getById(processId);

        res.send(getProcessResponse(bpmnProcess));
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

// TODO: paging?
function getProcesses(req, res, next) {
    var stateName, processName, bpmnProcesses, response;

    try {
        processName = querystring.unescape(req.params.processName);
        bpmnProcesses = bpmn.findByName(processName, false);

        if (req.query) {
            bpmnProcesses = bpmn.findByProperty(getPropertyQuery(req.query), bpmnProcesses);

            stateName = req.query[reservedQueryNames.state];
            if (stateName) {
                bpmnProcesses = bpmn.findByState(stateName, bpmnProcesses);
            }
        }

        response = bpmnProcesses.map(function(bpmnProcess) {
            return getProcessResponse(bpmnProcess);
        });

        res.send(response);

        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

function sendMessage(logger, req, res, next) {
    var processId, processName, messageId, messageName, bpmnProcess, idempotenceId;
    try {
        processId = getParameter(req, "id");
        processName = getParameter(req, "processName");
        messageId = getParameter(req, "messageId");
        messageName = getParameter(req, "messageName");
        bpmnProcess = bpmn.getById(processId);

        logger.setProcess(bpmnProcess);

        idempotenceId = processName + '.' + processId + '.' + messageName + '.' + messageId;
        if (hasBeenAlreadyReceived(idempotenceId)) {
            res.send(200, getProcessResponse(bpmnProcess));
        } else {
            triggerEvent(bpmnProcess, logger, messageName, req.body);
            // 201: Resource (=message) created
            res.send(201, getProcessResponse(bpmnProcess));
        }

        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

function getParameter(req, parameterName) {
    return (querystring.unescape(req.params[parameterName]));
}

/**
 * @param {BPMNProcess} bpmnProcess
 * @returns {{state: *}}
 */
function getProcessResponse(bpmnProcess) {
    var response = {}, processId, processName, escape;

    if (bpmnProcess) {

        processId = bpmnProcess.getProcessId();
        processName = bpmnProcess.getProcessDefinition().name;
        escape = querystring.escape;

        response = {
            id: processId,
            name: processName,
            link: {
                "rel": "self",
                "href": "/" + escape(processName) + "/" + escape(processId)
            },
            state: bpmnProcess.getState().tokens,
            history: bpmnProcess.getHistory().historyEntries,
            properties: bpmnProcess.getProperties()
        };

    }

    return response;
}

function getPropertyQuery(query) {
    var propertyQuery = {};
    var queryNames = Object.keys(query);

    queryNames.forEach(function(queryName) {
        if (!reservedQueryNames[queryName]) {
            propertyQuery[queryName] = query[queryName];
        }
    });

    return propertyQuery;
}

function getFileNameByProcessName(urlMap, processName) {
    var fileName = null;

    if (urlMap) {
        Object.keys(urlMap).forEach(function(name) {
            if (name.toLowerCase() === processName.toLowerCase()) {
                fileName = urlMap[name];
            }
        });
    } else {
        fileName = processName + ".bpmn";
    }

    return fileName;
}

function hasBeenAlreadyReceived(idempotenceId) {
    var result = false;

    if (idempotenceId) {
        if (receivedMessageIds[idempotenceId]) {
            result = true;
        } else {
            receivedMessageIds[idempotenceId] = true;
        }
    }

    return result;
}

function triggerEvent(bpmnProcess, logger, eventName, data) {
    var message = data || {};
    logger.trace("Triggering event '" + eventName + "'" + JSON.stringify(message));
    bpmnProcess.triggerEvent(eventName, data);
}

function sendError(error, next) {
    var restError;

    if (error.bpmnParseErrors) {
        restError = new restify.RestError({
            restCode: "BPMNParseError",
            body: error
        });
    } else {
        restError = new restify.RestError({
            restCode: "BPMNExecutionError",
            message: error.toString()
        });
    }

    return next(restError);
}


function onServerAfterEvent(logger, request, response, route, error) {
    var requestInfo = {
        method: request.method,
        headers: request.headers,
        body: request.body
    };
    var responseInfo = {
        method: response.method,
        headers: response.headers,
        body: response.body
    };

    logger.debug("route: " + JSON.stringify(route));
    logger.debug("request: " + JSON.stringify(requestInfo));
    logger.debug("response: " + JSON.stringify(responseInfo));

    if (error) {
        logger.debug("error: " + JSON.stringify(error));

    }
 }