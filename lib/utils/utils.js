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

function HashMap(caseSensitive) {
    this.values = {};
    this.caseSensitive = caseSensitive !== undefined ? caseSensitive : true;
}
exports.HashMap = HashMap;

HashMap.prototype._getKeyValue = function(key) {
    // no built in JS attribute contains '.'
    var k = "." + key;
    return (this.caseSensitive ? k : k.toLowerCase());
}

HashMap.prototype.set = function(key, value) {
  this.values[_getNonBuiltInKeyValue(key)] = value;
};

HashMap.prototype.get = function(key) {
    return this.values[_getNonBuiltInKeyValue(key)];
};

HashMap.prototype.clear = function() {
    this.values = {};
};