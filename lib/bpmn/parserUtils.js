/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

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