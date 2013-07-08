/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

/**
 * @param node
 * @param {String} attributeName
 * @return {String}
 */
exports.getAttributesValue = function(node, attributeName) {
    var value = null, attribute = null;
    var attributes = node.attributes;

    if (attributes) {
        attribute = attributes[attributeName];
        value = attribute ? attribute.value : null;
    }
    return value;
};

/**
 * @param {String} prefixedName A name such as ns1:blah
 * @return {{prefix: String, localName: String}}
 */
exports.splitPrefixedName = function(prefixedName) {
    var result = {prefix: "", localName: ""};
    var colon = prefixedName.indexOf(":");

    if (colon) {
        result.prefix = prefixedName.substring(0, colon);
        result.localName = prefixedName.substring(colon + 1);
    } else {
        result.localName = prefixedName;
    }

    return result;
};