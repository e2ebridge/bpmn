/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var bpmn = require('../../lib/public.js');
var restify = require('restify');
var pathModule = require('path');

var port = 8099;
var server = bpmn.createServer();

exports.testBasicRESTServer = function(test) {

    server.get('/echo/:name', echo);

    server.listen(port, function() {
        //console.log('%s listening at %s', server.name, server.url);

        var client = restify.createJsonClient({
            url: "http://localhost:" + port
        });

        client.get('/echo/gugus', function(err, req, res, obj) {
            if (err) {
                //console.log(err);
                test.ok(false, "testBasicRESTServer: nok");
            } else {
                //console.log(JSON.stringify(obj, null, 2));
                test.ok(true, "testBasicRESTServer: ok");
            }

            client.close();
            server.close(function() {
                test.done();
                //console.log("\nstopping server on port " + port);
            });
        });
    });
};

function echo(req, res, next) {
    res.send({echo: req.params.name});
    return next();
}


