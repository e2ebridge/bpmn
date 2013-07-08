/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var path = require('path');
var handlers = require('../../../lib/handler.js');

exports.testMapName2HandlerName = function(test) {
   var map = handlers.mapName2HandlerName;
   test.equal("_0_1_2_3_4_5_6_7_8_9_a_b_c_d_e_f_g_h_i_j_k_l_m_n_o_p_q_r_",
       map("0¦1+2\"3#4*5ç6&7¬8@9|a¢b(c)d?e^f~g`h!i{j}k;l:m,n o<p>q[r]"),
       "testMapName2HandlerName: list of not allowed characters");
   test.equal("_1x", map("1x"), "testMapName2HandlerName: name starting with a number");
   test.done();
};


exports.testLoadHandler = function(test) {
    var handlerFilePath = handlers.getHandlerFileName("a/b/c.bpmn");
    test.equal(handlerFilePath, "a/b/c.js","testLoadHandler: handlerFilePath");

    var bpmnFilePath = path.join(__dirname, "../../resources/projects/simple/taskExampleProcess.bpmn");
    var handler = handlers.getHandlerFromFile(bpmnFilePath);
    var myTaskHandler = handler.MyTask;
    var foundMyTask = myTaskHandler && typeof myTaskHandler === 'function';
    test.equal(foundMyTask, true,"testLoadHandler");

    test.done();
};
