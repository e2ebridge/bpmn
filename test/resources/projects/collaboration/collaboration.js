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
    var messageFlows = this.getOutgoingMessageFlows("End Event 1");
    this.sendMessage(messageFlows[0], {gugus: "blah"});
    done(data);
};

exports.Start_Event_2 = function(data, done) {
    log("Start_Event_2");
    done(data);
};

exports.Task_2 = function(data, done) {
    log("Task_2");
    this.getParticipantByName("My First Process", function(err, partnerProcess){
        partnerProcess.triggerEvent("Start Event 1");
        done(data);
    });
};

exports.End_Event_2 = function(data, done) {
    log("End_Event_2");
    done(data);
};

exports.Catch_MY_MESSAGE = function(data, done) {
    log("Catch_MY_MESSAGE");
    done(data);
};