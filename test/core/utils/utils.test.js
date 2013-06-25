/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
var utilsModule = require('../../../lib/utils/utils.js');

exports.testToUpperCamelCase = function(test){

    var result1 = utilsModule.toUpperCamelCase("an example");
    test.equal(result1,"AnExample", "testToUpperCamelCase: one blank");

    var result2 = utilsModule.toUpperCamelCase("an    example");
    test.equal(result2,"AnExample", "testToUpperCamelCase: many blanks");

    test.done();
};
