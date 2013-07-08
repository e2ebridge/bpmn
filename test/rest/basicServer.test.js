/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var bpmn = require('../../lib/public.js');
var restify = require('restify');

var port = 8099;
var server = bpmn.createServer();

exports.testBasicRESTServer = function(test) {

    server.get('/echo/:name', echo);

    server.listen(port, function() {
        //console.log('%s listening at %s', server.name, server.url);

        var client = restify.createJsonClient({
            url: "http://localhost:" + port
        });

        client.get('/echo/gugus', function(err) {
            test.ok(!err, "testBasicRESTServer: noError");

            client.close();
            server.close(function() {
                test.done();
            });
        });
    });
};

function echo(req, res, next) {
    res.send({echo: req.params.name});
    return next();
}


