/*global module exports console */


exports.MyStart = function( data , done ){
    // called after the start event arrived at MyStart
	console.log("MyStart");
	done();
};


exports.MyTask = function( data , done ){
    // called at the beginning of MyTask
	console.log("MyTask");
	done();
};

exports.MyTaskDone = function( data , done ){
    // Called after the process has been notified that the task has been finished
    // by invoking myProcess.taskDone("MyTask").
    // Note: <task name> + "Done" handler are only called for
    // user tasks, manual task, and unspecified tasks
    console.log("MyTaskDone");
    done();
};

exports.MyEnd = function( data , done ){
    // Called after MyEnd has been reached
	console.log("MyEnd");
	done();
};

/**
 * @param {String} eventType Possible types are: "activityFinishedEvent", "callHandler"
 * @param {String?} currentFlowObjectName The current activity or event
 * @param {String} handlerName
 * @param {String} reason Possible reasons:
 *                          - no handler given
 *                          - process is not in a state to handle the incoming event
 *                          - the event is not defined in the process
 *                          - the current state cannot be left because there are no outgoing flows
 */
exports.defaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason, done) {
    // Called, if no handler could be invoked.
    done(data);
};

exports.defaultErrorHandler = function(error, done) {
    // Called if errors are thrown in the event handlers
    done();
};

exports.onBeginHandler = function(currentFlowObjectName, data, done) {
    // do something
    done(data);
};

exports.onEndHandler = function(currentFlowObjectName, data, done) {
    // do something
    done(data);
};