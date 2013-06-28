/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

var bpmn = require('../lib/public.js');
var pathModule = require('path');

var port = 9998;
var urlMap = {
    "TaskExampleProcess": pathModule.join(__dirname, "./resources/projects/simple/taskExampleProcess.bpmn")
};

// Returns a restify server.
var server = bpmn.createServer({urlMap: urlMap, logLevel: "debug"});

server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});

