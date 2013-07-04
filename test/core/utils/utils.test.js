/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var utils = require('../../../lib/utils/utils.js');

exports.testToUpperCamelCase = function(test){

    var result1 = utils.toUpperCamelCase("an example");
    test.equal(result1,"AnExample", "testToUpperCamelCase: one blank");

    var result2 = utils.toUpperCamelCase("an    example");
    test.equal(result2,"AnExample", "testToUpperCamelCase: many blanks");

    test.done();
};


exports.testHashMapCaseSensitive = function(test){

    var hashMap = new utils.HashMap();
    hashMap.set("prototype", {blah: "x"});
    var value = hashMap.get("prototype");
    test.deepEqual(value, { blah: 'x' }, "testHashMapCaseSensitive: set/get");

    var keys = hashMap.getKeys();
    test.deepEqual(keys,
        [
            "prototype"
        ],
        "testHashMapCaseSensitive: keys"
    );

    hashMap.clear();
    var keysAfterClear = hashMap.getKeys();
    test.deepEqual(keysAfterClear, [], "testHashMapCaseSensitive: keysAfterClear");

    test.done();
};

exports.testHashMapNotCaseSensitive = function(test){

    var hashMap = new utils.HashMap(false);
    hashMap.set("prototype", {blah: "x"});
    var value = hashMap.get("ProtoType");
    test.deepEqual(value, { blah: 'x' }, "testHashMapCaseSensitive: set/get");

    test.done();
};

