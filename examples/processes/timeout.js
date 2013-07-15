/*global module exports console */

exports.MyTimeout$getTimeout = function(data, done) {
    // called when arriving on "MyTask"
    // should return timeout in ms.
    return 1000;
};

exports.MyTimeout = function(data, done) {
    // called if the timeout triggers
    done(data);
};
