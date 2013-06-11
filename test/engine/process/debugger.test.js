/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var restify = require('restify');
var loggerModule = require('../../../lib/logger.js');
var DebuggerInterface = require('../../../lib/debugger.js').DebuggerInterface;

exports.testSendingPositionToBPMNEditor = function(test) {

    var mockupDebugServer = restify.createServer();
    mockupDebugServer.use(restify.bodyParser({ mapParams: false }));

    mockupDebugServer.post('/grapheditor/debugger/position', function(req, res, next) {
        res.send(req.body);
        return next();
    });


    mockupDebugServer.listen(7261, function() {
        //console.log('%s listening at %s', mockupDebugServer.name, mockupDebugServer.url);

        var flowObject = {bpmnId: "_123"};
        var debuggerInterface = new DebuggerInterface('http://localhost:7261/grapheditor/debugger/position', "dummyFileName");
        var logger = new loggerModule.Logger();
        logger.setDefaultTransportsLogLevel('debug');


        debuggerInterface.sendPosition(flowObject, logger, function(error, req, res, obj) {
            test.ok(!error, "testSendingPositionToBPMNEditor: sendPosition: noError");

            test.deepEqual(obj,
                {
                    "filename": "dummyFileName",
                    "position": {
                        "bpmnId": "_123"
                    }
                },
                "testSendingPositionToBPMNEditor: sendPosition: echo of sent body"
            );

            mockupDebugServer.close();
            test.done();
        });
    });
};
