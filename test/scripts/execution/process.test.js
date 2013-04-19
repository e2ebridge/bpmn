/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var pathModule = require('path');
var processModule = require('../../../lib/execution/process.js');

exports.testMapName2HandlerName = function(test) {
   var map = processModule.mapName2HandlerName;
   test.equal("_0_1_2_3_4_5_6_7_8_9_a_b_c_d_e_f_g_h_i_j_k_l_m_n_o_p_q_r_",
       map("0¦1+2\"3#4*5ç6&7¬8@9|a¢b(c)d?e^f~g`h!i{j}k;l:m,n o<p>q[r]"),
       "testMapName2HandlerName: list of not allowed characters");
   test.equal("_1x", map("1x"), "testMapName2HandlerName: name starting with a number");
   test.done();
};

exports.testCreateVolatileBPMNProcess = function(test) {
    var state;

    var fileName = pathModule.join(__dirname, "../../resources/projects/simpleBPMN/taskExampleProcess.bpmn");
    var bpmnProcess = processModule.createBPMNProcess("myid", fileName);

    bpmnProcess.sendStartEvent("MyStart");

    process.nextTick(function() {
        //console.log("Comparing result after start event");
        state = bpmnProcess.getState();
        test.deepEqual(state.tokens,
            [
                {
                    "position": "MyTask",
                    "substate": null,
                    "owningProcessId": "myid"
                }
            ],
            "testCreateVolatileBPMNProcess: reached first wait state."
        );

        test.done();
    });
};

