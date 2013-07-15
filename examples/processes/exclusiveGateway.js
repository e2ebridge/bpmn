/*global module exports console */

exports.First_Task = function( data , done ){
    console.log("First_Task");
    done();
};

exports.Start_Event = function( data , done ){
    console.log("Start_Event");
    done();
};

exports.Task_A = function( data , done ){
    console.log("Task_A");
    done();
};

exports.Task_B = function( data , done ){
	console.log("Task_B");
	done();
};

exports.End_Event_B = function( data , done ){
	console.log("End_Event_B");
	done();
};


exports.End_Event_A = function( data , done ){
	console.log("End_Event_A");
	done();
};


exports.Is_it_ok_ = function(data, done) {
    // called after arriving at "Is it ok?"
    console.log("Is_it_ok_");
    done(data);
};

exports.Is_it_ok_$ok = function(data) {
    // has to return true or false
    // the name of the sequence flow follows after "$".
    // if there is no name, an error is thrown
    console.log("Is_it_ok_$ok");
    return true;
};

exports.Is_it_ok_$nok = function(data) {
    // has to return true or false
    // the name of the sequence flow follows after "$".
    // if there is no name, an error is thrown
    console.log("Is_it_ok_$nok");
    return false;
};

