/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmn = require("./public.js");
var logModule = require('./logger');
//var bunyan2winston = require("./utils/bunyan2winston");
var restify = require('restify');
var uuid = require('node-uuid');
var path = require('path');
var querystring = require('querystring');

var receivedMessageIds = {};
exports.clearReceivedMessageIds = function() {
    receivedMessageIds = {};
};

var reservedQueryNames = {
    "_state_": "_state_"
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
function createServer(options, restifyOptions) {

    var settings = options || {};
    settings.urlMap = settings.urlMap || {};
    settings.createProcessId = settings.createProcessId || uuid.v1;

    var logger = new logModule.Logger(null, settings);
    var serverOptions = restifyOptions || {};
    serverOptions.name = serverOptions.name || "BPMNProcessServer";

    // Shimming the log doesn't work as expected: I cannot switch it off for example.
    // Additionally, the log format is horrible. So for the time being we use our own logging
    //serverOptions.log = serverOptions.log || bunyan2winston.createLogger(logger.winstonLogger);

    var server = restify.createServer(serverOptions);
    server.use(restify.queryParser({ mapParams: false }));
    server.use(restify.bodyParser({ mapParams: false }));

    server.on('after', function( request, response, route, error) {
        var handler = options.onServerAfterEvent || onServerAfterEvent;
        handler(logger, request, response, route, error);
    });

    server.get(getProcessRoute, getProcess);
    server.get(getProcessesRoute, getProcesses);
    server.put(sendMessageRoute,function(req, res, next) {
        sendMessage(logger, req, res, next);
    });
    server.post(createProcessRoute, function(req, res, next) {
        createProcess(settings, logger, req, res, next);
    });
    server.post(createAndStartProcessRoute, function(req, res, next) {
        createAndStartProcess(settings, logger, req, res, next);
    });

    return server;
}
exports.createServer = createServer;

function createProcess(settings, logger, req, res, next) {
    createAndStartProcess(settings, logger, req, res, next, false);
}

function createAndStartProcess(options, logger, req, res, next, startProcess) {

    var bpmnProcess = null;

    try {
        var urlMap = options.urlMap;
        var processId = options.createProcessId();
        var processName = querystring.unescape(req.params.processName);
        var bpmnFile = getFileNameByProcessName(urlMap, processName);
        if (bpmnFile) {
            bpmnProcess = bpmn.createProcess(processId, bpmnFile);
            logger.setProcess(bpmnProcess);

            var processNameFromDefinition = bpmnProcess.getProcessDefinition().name;
            if (processName.toLowerCase() !== processNameFromDefinition.toLowerCase()) {
                return next(new restify.InvalidArgumentError("Did find process '" + processNameFromDefinition +
                    "' but not the process name '" + processName +
                    "' in the associated BPMN file '" + bpmnFile + "'"));
            } else {
                if (startProcess === undefined || startProcess) {
                    var startEventName = querystring.unescape(req.params.startEventName);
                    triggerEvent(bpmnProcess, logger, startEventName, req.body, true);
                }
             }
        } else {
            return next(new restify.InvalidArgumentError("Could not map process name '" + processName + "' to BPMN file."));
        }

        res.send(201, getProcessResponse(bpmnProcess));
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}


function getProcess(req, res, next) {
    try {
        var processId = getParameter(req, "id");
        var bpmnProcess = bpmn.getById(processId);
        res.send(getProcessResponse(bpmnProcess));
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

// TODO: paging?
function getProcesses(req, res, next) {
    try {
        var processName = querystring.unescape(req.params.processName);
        var bpmnProcesses = bpmn.findByName(processName, false);
        if (req.query) {
            bpmnProcesses = bpmn.findByProperty(getPropertyQuery(req.query), bpmnProcesses);

            var stateName = req.query[reservedQueryNames._state_];
            if (stateName) {
                bpmnProcesses = bpmn.findByState(stateName, bpmnProcesses);
            }
        }
        var response = bpmnProcesses.map(function(bpmnProcess) {
            return getProcessResponse(bpmnProcess);
        });
        res.send(response);
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

function sendMessage(logger, req, res, next) {
    try {
        var processId = getParameter(req, "id");
        var processName = getParameter(req, "processName");
        var messageId = getParameter(req, "messageId");
        var messageName = getParameter(req, "messageName");
        var bpmnProcess = bpmn.getById(processId);
        logger.setProcess(bpmnProcess);

        var idempotenceId = processName + '.' + processId + '.' + messageName + '.' + messageId;
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
    var response = {};

    if (bpmnProcess) {

        var processId = bpmnProcess.getProcessId();
        var processName = bpmnProcess.getProcessDefinition().name;
        var escape = querystring.escape;

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
    logger.debug("route: " + JSON.stringify(route));

    var requestInfo = {
        method: request.method,
        headers: request.headers,
        body: request.body
    };
    logger.debug("request: " + JSON.stringify(requestInfo));

    var responseInfo = {
        method: response.method,
        headers: response.headers,
        body: response.body
    };
    logger.debug("response: " + JSON.stringify(responseInfo));

    if (error) {
        logger.debug("error: " + JSON.stringify(error));

    }
 }