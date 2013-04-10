/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {Array.<{id: string}>} objects
 * @return {Object}
 */
exports.buildIndex = function (objects) {
    var index = {};
    objects.forEach(function(object) {
        index[object.id] = object;
    });
    return index;
};

/**
 * Split and indent a string containing new lines and tabs. Mainly used for testing
 * @param {String} lines
 * @return {Array.<String>}
 */
exports.splitLines = function(lines) {
    return lines.replace(/\r\n/g, "\n").replace(/\t/g, " ").split("\n");
};

/**
 * @param {String} name
 * @return {String}
 */
exports.toUpperCamelCase = function(name) {
    var result = "";
    var parts = name.split(/\s+/g);
    parts.forEach(function(part) {
        result += firstToUpper(part);
    });
    return result;
};

/**
 * @param {String} name
 * @return {String}
 */
exports.firstToUpper = firstToUpper = function(name) {
    return (name.substring(0,1).toUpperCase() + name.substring(1));
};