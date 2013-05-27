/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {string} code
 * @param {string} description
 * @constructor
 */
function BPMNError(code, description){
    this.code = code;
    this.description = description;
}

/**
 * @param {String=} fileName
 * @constructor
 */
function ErrorQueue(fileName) {
    /** @tpe {Array.<BuildError>} */
    this.bpmnErrors = [];
    this.fileName = fileName;
}

/**
 * @param {string} code
 * @param {string} description
 */
ErrorQueue.prototype.addError = function addError(code, description) {
   this.bpmnErrors.push(new BPMNError(code, description));
};

/**
 * @return {Array.<BPMNError>}
 */
ErrorQueue.prototype.getErrors = function getErrors() {
    return this.bpmnErrors;
};

/**
 *
 * @param {function(BPMNError)} reportFunction
 */
ErrorQueue.prototype.reportErrors = function reportErrors(reportFunction) {
    var errors = this.getErrors();
    errors.forEach(function(error) {
        reportFunction(error);
    });
};

/**
 * @return {int}
 */
ErrorQueue.prototype.getNumberOfErrors = function getNumberOfErrors() {
    return this.bpmnErrors.length;
};

/**
 * @return {Boolean}
 */
ErrorQueue.prototype.hasErrors = function hasErrors() {
    return (this.getNumberOfErrors() > 0);
};

ErrorQueue.prototype.clear = function clearErrors() {
    this.bpmnErrors = [];
};

ErrorQueue.prototype.throw = function throwErrors() {
    // call built-in Error object to get stack and other properties required by the test framework
    var exception = new Error();

    // mix-in relevant properties
    exception.bpmnErrors = this.bpmnErrors;
    exception.reportErrors = this.reportErrors;
    exception.getNumberOfErrors = this.getNumberOfErrors;
    exception.getErrors = this.getErrors;

    throw exception;
};

ErrorQueue.prototype.check = function checkErrors() {
    if (this.hasErrors()) {
         this.throw();
    }
};

/**
 * @param {String=} fileName
 * @return {ErrorQueue}
 */
exports.createErrorQueue = function createErrorQueue(fileName) {
    return (new ErrorQueue(fileName));
};
