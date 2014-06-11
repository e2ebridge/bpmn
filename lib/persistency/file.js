/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var JaguarDb = require('jaguardb').JaguarDb;

/**
 * @param {String} path Path to directory containing the files
 * @constructor
 */
var Persistency = exports.Persistency = function(path) {
    this.path = path;
    this.db = new JaguarDb();
};

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function} done
 */
Persistency.prototype.persist = function(persistentData, done) {
    var db = this.db;
    var processId = persistentData.processId;
    var query = {processId: processId};
    var fields = {}; // all fields

    db.connect(this.path, function(error) {
        if(error) {
            done(error);
        } else {
            db.find(query, fields, function(err, documents) {
                if (documents && documents.length > 0) {
                    if (documents.length === 1) {
                        persistentData._id = documents[0]._id;
                        persistentData._saved = documents[0]._saved;
                        persistentData._updated = Date.now();
                        db.update(persistentData, function(error, updatedData) {
                            if(error) {
                                done(error);
                            } else {
                                done(null, updatedData);
                            }
                        });
                    } else {
                        done(new Error("Process ID: '" + processId + "' is not unique in the DB"));
                    }
                } else {
                    persistentData._saved = Date.now();
                    persistentData._updated = persistentData._saved;
                    db.insert(persistentData, function(error, insertedData) {
                        if(error) {
                            done(error);
                        } else {
                            done(null, insertedData);
                        }
                    });
                }
            });
        }
    });
};

/**
 * @param {String} processId
 * @param {String} processName
 * @param done
 */
Persistency.prototype.load = function(processId, processName, done) {
    var db = this.db;
    var query = {processId: processId, processName: processName};
    var fields = {}; // all fields

    db.connect(this.path, function(error) {
        if(error) {
            done(error);
        } else {
            db.find(query, fields, function(err, documents) {
                if (documents && documents.length > 0) {
                    if (documents.length === 1) {
                        if(error) {
                            done(error);
                        } else {
                            done(null, documents[0]);
                        }
                    } else {
                        done(new Error("Persistency: Process ID: '" + processId + "' is not unique in the DB"));
                    }
                } else {
                    // we allow that nothing has been found because this happens
                    // the very first time when the process is being created
                    done();
                }
            });
        }
    });
};

/**
 * @param {String} processName
 * @param done
 */
Persistency.prototype.loadAll = function(processName, done) {
    var db = this.db;
    var query = {processName: processName};
    var fields = {}; // all fields

    db.connect(this.path, function(error) {
        if(error) {
            done(error);
        } else {
            db.find(query, fields, function(err, documents) {
                if(err){
                    return done(err);
                }

                if (documents) {
                    done(null, documents);
                } else {
                    done(null, []);
                }
            });
        }
    });
};

Persistency.prototype.close = function() {};
