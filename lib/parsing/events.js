/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

/**
 * @param localName name without namespace prefix
 * @return {Boolean}
 */
exports.isMessageEventName = function(localName) {
    return (localName === "messageEventDefinition");
};
