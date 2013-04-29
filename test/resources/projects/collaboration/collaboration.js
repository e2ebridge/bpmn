/*global exports */

var doLog = false;

function log(eventName) {
    if (doLog) console.log("collaboration.js: Calling handler for '" + eventName + "'");
}

exports.Start_Event_1 = function(data, done) {
    log("Start_Event_1");
    done(data);
};

exports.Task_1 = function(data, done) {
    log("Task_1");
    done(data);
};

exports.End_Event_1 = function(data, done) {
    log("End_Event_1");
    var partnerProcess = this.getParticipantByName("My Second Process");
    partnerProcess.sendEvent("Catch End Event 1");
    done(data);
};

exports.Start_Event_2 = function(data, done) {
    log("Start_Event_2");
    done(data);
};

exports.Task_2 = function(data, done) {
    log("Task_2");
    var partnerProcess = this.getParticipantByName("My First Process");
    partnerProcess.sendEvent("Start Event 1");
    done(data);
};

exports.End_Event_2 = function(data, done) {
    log("End_Event_2");
    done(data);
};

exports.Catch_End_Event_1 = function(data, done) {
    log("Catch_End_Event_1");
    done(data);
};