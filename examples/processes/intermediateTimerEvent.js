/*global module exports console */

exports.Intermediate_Catch_Timer_Event$getTimeout = function(data, done) {
    // called when arriving on "Intermediate Catch Timer Event"
    // should return wait time in ms.
    return 10000;
};

exports.Intermediate_Catch_Timer_Event = function( data , done ){
    // called if the timeout triggers
	console.log("Intermediate_Catch_Timer_Event");
	done();
};
