/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var handlerModule = require('../../../lib/execution/handler.js');

exports.testMapName2HandlerName = function(test) {
   var map = handlerModule.mapName2HandlerName;
   test.equal("_0_1_2_3_4_5_6_7_8_9_a_b_c_d_e_f_g_h_i_j_k_l_m_n_o_p_q_r_",
       map("0¦1+2\"3#4*5ç6&7¬8@9|a¢b(c)d?e^f~g`h!i{j}k;l:m,n o<p>q[r]"),
       "testMapName2HandlerName: list of not allowed characters");
   test.equal("_1x", map("1x"), "testMapName2HandlerName: name starting with a number");
   test.done();
};


exports.testLoadHandler = function(test) {
    var handlerFilePath = handlerModule.getHandlerFileName("a/b/c.bpmn");
    test.equal(handlerFilePath, "a/b/c.js","testLoadHandler: handlerFilePath");

    var bpmnFilePath = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var handler = handlerModule.getHandlerFromFile(bpmnFilePath);
    var myTaskHandler = handler["MyTask"];
    var foundMyTask = myTaskHandler && typeof myTaskHandler === 'function';
    test.equal(foundMyTask, true,"testLoadHandler");

    test.done();
};
