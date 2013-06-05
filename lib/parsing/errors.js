/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {string} code
 * @param {{bpmnId: string, name: string, type: string}} bpmnElement
 * @param {string} description
 * @constructor
 */
function BPMNParseError(code, bpmnElement, description){
    this.code = code;
    this.description = description;
    if (bpmnElement) { // = null, if we cannot parse the file, for example
        this.bpmnId = bpmnElement.bpmnId || "Unknown";
        this.bpmnName = bpmnElement.name || "";
        this.bpmnType = bpmnElement.type || "Unknown";
    }
}

/**
 * @param {String=} fileName
 * @constructor
 */
function BPMNParseErrorQueue(fileName) {
    /** @tpe {Array.<BuildError>} */
    this.bpmnParseErrors = [];
    this.fileName = fileName;
}

/**
 * @param {string} code
 * @param {{bpmnId: string, name: string, type: string}} bpmnElement
 * @param {string} description
 */
BPMNParseErrorQueue.prototype.addError = function addError(code, bpmnElement, description) {
   this.bpmnParseErrors.push(new BPMNParseError(code, bpmnElement, description));
};

/**
 * @return {Array.<BPMNParseError>}
 */
BPMNParseErrorQueue.prototype.getErrors = function getErrors() {
    return this.bpmnParseErrors;
};

/**
 *
 * @param {function(BPMNParseError)} reportFunction
 */
BPMNParseErrorQueue.prototype.reportErrors = function reportErrors(reportFunction) {
    var errors = this.getErrors();
    errors.forEach(function(error) {
        reportFunction(error);
    });
};

/**
 * @return {int}
 */
BPMNParseErrorQueue.prototype.getNumberOfErrors = function getNumberOfErrors() {
    return this.bpmnParseErrors.length;
};

/**
 * @return {Boolean}
 */
BPMNParseErrorQueue.prototype.hasErrors = function hasErrors() {
    return (this.getNumberOfErrors() > 0);
};

BPMNParseErrorQueue.prototype.clear = function clearErrors() {
    this.bpmnParseErrors = [];
};

BPMNParseErrorQueue.prototype.throw = function throwErrors() {
    // call built-in Error object to get stack and other properties required by the test framework
    var exception = new Error();

    // mix-in relevant properties
    exception.bpmnParseErrors = this.bpmnParseErrors;
    exception.reportErrors = this.reportErrors;
    exception.getNumberOfErrors = this.getNumberOfErrors;
    exception.getErrors = this.getErrors;

    throw exception;
};

BPMNParseErrorQueue.prototype.check = function checkErrors() {
    if (this.hasErrors()) {
         this.throw();
    }
};

/**
 * @param {String=} fileName
 * @return {BPMNParseErrorQueue}
 */
exports.createBPMNParseErrorQueue = function (fileName) {
    return (new BPMNParseErrorQueue(fileName));
};
