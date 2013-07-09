/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmn = require('../lib/public.js');
var path = require('path');

var port = 9998;
var urlMap = {
    "TaskExampleProcess": path.join(__dirname, "./resources/projects/simple/taskExampleProcess.bpmn")
};

// Returns a restify server.
var server = bpmn.createServer({
                urlMap: urlMap,
                logLevel: "debug",
                persistency: {
                    uri: 'mongodb://127.0.0.1:27017/exampledb'
                }
});

server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});

