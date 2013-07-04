/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

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
var firstToUpper = exports.firstToUpper = function(name) {
    return (name.substring(0,1).toUpperCase() + name.substring(1));
};

var HashMap = exports.HashMap = function HashMap(caseSensitive) {
    this.values = {};
    this.caseSensitive = caseSensitive !== undefined ? caseSensitive : true;
    this.prefix = '.'; // a char not allowed in JS names
    this.offset = this.prefix.length;
};

/**
 * @param {{toString: function}} key
 * @returns {string}
 * @private
 */
HashMap.prototype._getKeyValue = function(key) {
    // no built in JS attribute contains '.'
    var k = this.prefix + key;
    return (this.caseSensitive ? k : k.toLowerCase());
};

/**
 * @param {{toString: function}} key
 * @param {*} value
 */
HashMap.prototype.set = function(key, value) {
  var prefixedKey = this._getKeyValue(key);
  this.values[prefixedKey] = value;
};

/**
 * @param {{toString: function}} key
 * @return {*}
 */
HashMap.prototype.get = function(key) {
    var prefixedKey = this._getKeyValue(key);
    return (this.values[prefixedKey]);
};

HashMap.prototype.clear = function() {
    this.values = {};
};

/**
 * @returns {Array.<String>}
 */
HashMap.prototype.getKeys = function() {
    var self = this;
    var prefixedKeys = Object.keys(this.values);
    return prefixedKeys.map(function(prefixedKey) {
        return prefixedKey.substring(self.offset);
    });
};