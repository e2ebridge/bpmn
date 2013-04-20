/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

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