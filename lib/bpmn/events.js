/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */


/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isMessageEventName = function(localName) {
    return (localName === "messageEventDefinition");
};
