/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmn = require('../lib/public.js');
var restify = require('restify');
var pathModule = require('path');

var port = 9099;
var urlMap = {
    "myProcess": pathModule.join(__dirname, "./resources/projects/simple/taskExampleProcess.bpmn")
};

// Returns a restify server.
var server = bpmn.createServer(urlMap);

server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});

