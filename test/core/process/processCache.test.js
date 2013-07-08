/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var processCache = require('../../../lib/processCache.js');

exports.testCacheHasMatchingPropertiesNOK = function(test) {

    var processData = {
        x: "y"
    };

    var query = {
        "a": "b",
        "x": "y"
    };

    var queryFields = Object.getOwnPropertyNames(query);

    var hasProperties = processCache.hasMatchingProperties(processData, queryFields, query);
    test.ok(!hasProperties, "testCacheHasMatchingPropertiesNOK");

    test.done();
};

exports.testCacheHasMatchingPropertiesOK = function(test) {

    var processData = {
        x: "y",
        a: "b"
    };

    var query = {
        "x": "y",
        "a": "b"
    };

    var queryFields = Object.getOwnPropertyNames(query);

    var hasProperties = processCache.hasMatchingProperties(processData, queryFields, query);
    test.ok(hasProperties, "testCacheHasMatchingPropertiesOK");

    test.done();
};

exports.testCacheHasMatchingSimpleProperty = function(test) {

    var processData = {
        x: "y"
    };

    var hasProperty1 = processCache.hasMatchingProperty(processData, "x", "y");
    test.ok(hasProperty1, "testCacheHasMatchingSimpleProperty: hasProperty1");

    var hasProperty2 = processCache.hasMatchingProperty(processData, "xx", "y");
    test.ok(!hasProperty2, "testCacheHasMatchingSimpleProperty: hasProperty2");

    var hasProperty3 = processCache.hasMatchingProperty(processData, "x", "yy");
    test.ok(!hasProperty3, "testCacheHasMatchingSimpleProperty: hasProperty3");

    test.done();
};

exports.testCacheHasMatchingComplexProperty = function(test) {

    var processData = {
        x: {
            y: {
                z: "uvw"
            }
        }
    };

    var hasProperty1 = processCache.hasMatchingProperty(processData, "x.y.z", "uvw");
    test.ok(hasProperty1, "testCacheHasMatchingComplexProperty: hasProperty1");

    var hasProperty2 = processCache.hasMatchingProperty(processData, "x.yy.z", "uvw");
    test.ok(!hasProperty2, "testCacheHasMatchingComplexProperty: hasProperty2");

    var hasProperty3 = processCache.hasMatchingProperty(processData, "x.y.z", "uvwww");
    test.ok(!hasProperty3, "testCacheHasMatchingComplexProperty: hasProperty3");

    var hasProperty4 = processCache.hasMatchingProperty(processData, ".x.y.", "uvwww");
    test.ok(!hasProperty4, "testCacheHasMatchingComplexProperty: hasProperty4");

    test.done();
};

exports.testCacheHasMatchingNonsenseProperty = function(test) {

    var processData = {
        x: {
            y: {
                z: "uvw"
            }
        }
    };

    var hasProperty1 = processCache.hasMatchingProperty(processData, "x.y.z", null);
    test.ok(!hasProperty1, "testCacheHasMatchingNonsenseProperty: hasProperty1");

    var hasProperty2 = processCache.hasMatchingProperty(processData, "", "uvw");
    test.ok(!hasProperty2, "testCacheHasMatchingNonsenseProperty: hasProperty2");

    var hasProperty3 = processCache.hasMatchingProperty(processData, null, "uvwww");
    test.ok(!hasProperty3, "testCacheHasMatchingNonsenseProperty: hasProperty3");

    var hasProperty4 = processCache.hasMatchingProperty(null, ".x.y.", "uvwww");
    test.ok(!hasProperty4, "testCacheHasMatchingNonsenseProperty: hasProperty4");

    var hasProperty5 = processCache.hasMatchingProperty(processData, null, undefined);
    test.ok(!hasProperty5, "testCacheHasMatchingNonsenseProperty: hasProperty5");

    test.done();
};