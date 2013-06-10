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

var requestIds = {};
var requestIdName = "_requestId_";

var reservedQueryNames = {
    "_state_": "_state_"
};

/**
 * Creates a REST server based on the restify framework. It takes two parameters, options and restifyOptions.
 *      options: optional object having the following optional properties
 *          urlMap: Contains for each process name occurring in the URL the BPMN file path. If not given, the file name is derived by process name + '.bpmn'
 *          getProcessId: Function that returns a UUID. Default: node-uuid.v1()
 *          logLevel: used log level. Default: Error. Use logger.logLevels to set.
 *      restifyOptions: these options are given to the restify.createServer call.
 *                      If not given, the log property is set to the internal winston logger and
 *                      the name property is set to 'bpmnRESTServer'
 * @param {{urlMap: {processName: string, getProcessId: function, logLevel: logger.logLevels}}=} options
 * @param {Object=} restifyOptions
 * @returns {*}
 */
function createServer(options, restifyOptions) {

    var urlMap = {};
    var getProcessId = uuid.v1;
    if (options) {
        urlMap = options.urlMap || urlMap;
        getProcessId = options.getProcessId || getProcessId;
    }

    var logger = new logModule.Logger(null, options);
    var shim = bunyan2winston.createLogger(logger.winstonLogger);

    var serverOptions = restifyOptions || {};
    serverOptions.name = serverOptions.name || "bpmnRESTServer";
    serverOptions.log = serverOptions.log || shim;

    var server = restify.createServer(serverOptions);
    server.use(restify.queryParser({ mapParams: false }));
    server.use(restify.bodyParser({ mapParams: false }));

    server.get('/:processName', getProcessesHandler);
    server.get('/:processName/:id', getProcessHandler);
    server.put('/:processName/:id',function(req, res, next) {
        putEventHandler(logger, req, res, next);
    });
    server.post('/:processName', function(req, res, next) {
        postProcessHandler(urlMap, getProcessId, logger, req, res, next);
    });

    return server;
}
exports.createServer = createServer;

function postProcessHandler(urlMap, getId, logger, req, res, next) {
    try {
        var processId = getId();
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
                var body = req.body;
                if (hasNonEmptyBody(body)) {
                    triggerEvent(bpmnProcess, logger, body);
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

function getProcessHandler(req, res, next) {
    try {
        var processId = getProcessId(req);
        var bpmnProcess = bpmn.getById(processId);
        res.send(getProcessResponse(bpmnProcess));
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

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

function getProcessId(req) {
    return (req.params.id ? querystring.unescape(req.params.id) : "undefined");
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

function putEventHandler(logger, req, res, next) {
    try {
        var body = req.body;
        if (hasNonEmptyBody(body)) {
            var processId = getProcessId(req);
            var bpmnProcess = bpmn.getById(processId);
            triggerEvent(bpmnProcess, logger, body);
            res.send(getProcessResponse(bpmnProcess));
            return next();
        } else {
            return next(new restify.InvalidArgumentError("PUT: no body found."));
        }
     } catch (e) {
        return sendError(e, next);
    }
}

function hasNonEmptyBody(body) {
    var result = false;
    if (body && typeof body === 'object') {
        var keys = Object.keys(body);
        if (keys.length > 0) {
            result = true;
        }
    }
    return result;
}

function requestHasBeenSent(body) {
    var result = false;
    var requestId = body[requestIdName];
    if (requestId) {
        if (requestIds[requestId]) {
            result = true;
        } else {
            requestIds[requestId] = true;
        }
    }
    return result;
}

function triggerEvent(bpmnProcess, logger, body) {

    if (requestHasBeenSent(body)) return;

    var keys = Object.keys(body);
    var names = keys.filter(function(key) {
        return (key !== requestIdName);
    });

    var eventName = names[0];
    if (eventName) {
        var message = body[eventName];
        logger.trace("Triggering event '" + eventName + "'" + JSON.stringify(message));
        bpmnProcess.triggerEvent(eventName, message);
    }
}

