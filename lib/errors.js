/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

/**
 * @param {string} code
 * @param {string} fileName
 * @param {string} description
 * @constructor
 */
function BPMNError(code, fileName, description){
    this.code = code;
    this.fileName = fileName;
    this.description = description;
}

function ErrorQueue() {
    /** @tpe {Array.<BuildError>} */
    this.buildErrors = [];
}

/**
 * @param {string} code
 * @param {string} fileName
 * @param {string} description
 */
ErrorQueue.prototype.addError = function addError(code, fileName, description) {
   this.buildErrors.push(new BPMNError(code, fileName, description));
};

/**
 * @return {Array.<BPMNError>}
 */
ErrorQueue.prototype.getErrors = function getErrors() {
    return this.buildErrors;
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
    return this.buildErrors.length;
};

/**
 * @return {Boolean}
 */
ErrorQueue.prototype.hasErrors = function hasErrors() {
    return (this.getNumberOfErrors() > 0);
};

ErrorQueue.prototype.clear = function clearErrors() {
    this.buildErrors = [];
};

ErrorQueue.prototype.throw = function throwErrors() {
    // call built-in Error object to get stack and other properties required by the test framework
    var exception = new Error();

    // mixin relevant properties
    exception.buildErrors = this.buildErrors;
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
 * @return {ErrorQueue}
 */
exports.createErrorQueue = function createErrorQueue() {
    return (new ErrorQueue());
};
