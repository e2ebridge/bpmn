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
    server.use(restify.queryParser());
    server.use(restify.bodyParser({ mapParams: false }));

    var create = function(req, res, next) {
        createProcess(urlMap, getProcessId, logger, req, res, next);
    };

    // Questions: use put to send messages and trigger events?
    server.get('/:processName', getProcesses);
    server.get('/:processName/:id', getProcess);
    server.post('/:processName', create);

    return server;
}
exports.createServer = createServer;

function createProcess(urlMap, getId, logger, req, res, next) {
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
                if (req.body && typeof req.body === 'object') {
                    var keys = Object.keys(req.body);
                    var startEventName = keys[0];
                    if (startEventName) {
                        var message = req.body[startEventName];
                        logger.trace("Start process by triggering event '" + startEventName + "'" + JSON.stringify(message));
                        bpmnProcess.triggerEvent(startEventName, message);
                    }
                }
            }
        } else {
            return next(new restify.InvalidArgumentError("Could not map process name '" + processName + "' to BPMN file."));
        }

        res.send({processName: bpmnProcess.getProcessDefinition().processName, processId: processId});
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

/**
 * @param {BPMNProcess} bpmnProcess
 * @returns {{state: *}}
 */
function getProcessResponse(bpmnProcess) {
    var response = {};
    if (bpmnProcess) {
        response = {
            state: bpmnProcess.getState(),
            history: bpmnProcess.getHistory(),
            data: bpmnProcess.getProperties()
        };
    }
    return response;
}


function getProcess(req, res, next) {
    try {
        var processId = req.params.id ? querystring.unescape(req.params.id) : "undefined";
        var bpmnProcess = bpmn.getById(processId);
        res.send(getProcessResponse(bpmnProcess));
        return next();
    } catch (e) {
        return sendError(e, next);
    }
}

function getProcesses(req, res, next) {
    try {
        var processName = querystring.unescape(req.params.processName);
        var bpmnProcesses = bpmn.findByName(processName, false);
        var response = bpmnProcesses.map(function(bpmnProcess) {
            return getProcessResponse(bpmnProcess);
        });
        res.send(response);
        return next();
    } catch (e) {
        return sendError(e, next);
    }
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


