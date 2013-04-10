/*global exports */

exports.MyStart = function(data, done) {
    console.log("taskExampleProcess.js: Calling handler for 'MyStart'");
    done(data);
};

exports.MyTask = function(data, done) {
    console.log("taskExampleProcess.js: Calling handler for 'MyTask'");
    done(data);
};

exports.MyTaskDone = function(data, done) {
    console.log("taskExampleProcess.js: Calling handler for 'MyTaskDone'");
    done(data);
};

exports.MyEnd = function(data, done) {
    console.log("taskExampleProcess.js: Calling handler for 'MyEnd'");
    done(data);
};