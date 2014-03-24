/*global exports */

var doLog = false;

function log(eventName) {
    if (doLog) console.log("taskExampleProcess.js: Calling handler for '" + eventName + "'");
}

exports.MyStart = function(data, done) {
    log("MyStart");
    if (data) {
        log("Data: " + JSON.stringify(data, null, "  "));
        this.setProperty("myFirstProperty", data);
    }
    done(data);
};

exports.MyTask = function(data, done) {
    log("MyTask");
    done(data);
};

exports.MyTaskDone = function(data, done) {
    log("MyTaskDone");
    done(data);
};

exports.MyEnd = function(data, done) {
    log("MyEnd");
    done(data);
};