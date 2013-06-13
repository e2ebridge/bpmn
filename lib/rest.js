/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmn = require("./public.js");
var logModule = require('./logger');
var bunyan2winston = require("./utils/bunyan2winston");
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
    serverOptions.name = serverOptions.name || "bpmnRESTServer";
    serverOptions.log = serverOptions.log || bunyan2winston.createLogger(logger.winstonLogger);

    var server = restify.createServer(serverOptions);
    server.use(restify.queryParser({ mapParams: false }));
    server.use(restify.bodyParser({ mapParams: false }));

    server.get('/:processName', getProcessesHandler);
    server.get('/:processName/:id', getProcessHandler);
    server.put('/:processName/:id/:messageName/:messageId',function(req, res, next) {
        putEventHandler(logger, req, res, next);
    });
    server.post('/:processName', function(req, res, next) {
        postProcessHandler(settings, logger, req, res, next);
    });
    server.post('/:processName/:startEventName', function(req, res, next) {
        postProcessHandler(settings, logger, req, res, next, true);
    });

    return server;
}
exports.createServer = createServer;

function postProcessHandler(options, logger, req, res, next, startProcess) {
    try {
        var urlMap = options.urlMap;
        var processId = options.createProcessId();
        var processName = querystring.unescape(req.params.processName);
        var bpmnFile = getFileNameByProcessName(urlMap, processName);
        if (bpmnFile) {
            var bpmnProcess = bpmn.createProcess(processId, bpmnFile);
            logger.setProcess(bpmnProcess);

            var processNameFromDefinition = bpmnProcess.getProcessDefinition().name;
            if (processName.toLowerCase() !== processNameFromDefinition.toLowerCase()) {
                return next(new restify.InvalidArgumentError("Did find process '" + processNameFromDefinition +
                    "' but not th process name '" + processName +
                    "' in the associated BPMN file '" + bpmnFile + "'"));
            } else {
                if (startProcess) {
                    var startEventName = querystring.unescape(req.params.startEventName);

                    if (startEventName) {
                        triggerEvent(bpmnProcess, logger, startEventName, req.body, true);
                    }
                }
             }
        } else {
            return next(new restify.InvalidArgumentError("Could not map process name '" + processName + "' to BPMN file."));
        }

        res.send({name: bpmnProcess.getProcessDefinition().name, id: processId});
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

// TODO: return self link
function getProcessHandler(req, res, next) {
    try {
        var processId = getParameter(req, "id");
        var bpmnProcess = bpmn.getById(processId);
        res.send(getProcessResponse(bpmnProcess));
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

// Todo return links (paging?)
function getProcessesHandler(req, res, next) {
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
        response = {
            id: bpmnProcess.getProcessId(),
            state: bpmnProcess.getState(),
            history: bpmnProcess.getHistory(),
            data: bpmnProcess.getProperties()
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

function putEventHandler(logger, req, res, next) {
    try {
        var processId = getParameter(req, "id");
        var processName = getParameter(req, "processName");
        var messageId = getParameter(req, "messageId");
        var messageName = getParameter(req, "messageName");
        var bpmnProcess = bpmn.getById(processId);

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


