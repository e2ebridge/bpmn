/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {String} name
 * @return {String}
 */
exports.getXMLElementName = function(name) {
    var elementName = name;
    if (name.match(/^[0-9]/)) {
        elementName = "_" + elementName;
    }
    elementName = elementName.replace(/[ \\\/\t\n:\*+\"%&(){}\[\]`\^~\?|@\$<>#!]/g,"_");
    return elementName;
};

/**
 * @param {String} name Something like [<prefix>:]<local-name>
 * @return {String}
 */
exports.getLocalName = function(name) {
    var localName = name;
    var index = name.lastIndexOf(':');
    if (index > -1) {
        localName = name.substring(index + 1);
    }
    return localName;
};
