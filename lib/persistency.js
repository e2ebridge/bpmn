/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fileUtilsModule = require('./utils/file.js');
var JaguarDb = require('jaguarDb').JaguarDb;

/**
 * @param {{path: String}} options
 * @constructor
 */
function Persistency(options) {
    var path = options ? options.path : null;

    if (path) {
        this.path = path;
        this.db = getDB(true);
        // make sure the path exists
        fileUtilsModule.writeDirSync(this.path);
    } else {
        // TODO: MongoDB
    }
}
exports.Persistency = Persistency;

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function(error, data)} done
 */
Persistency.prototype.persist = function(persistentData, done) {
    var db = this.db;

    db.connect(this.path, function(error) {
        if(error) {
            done(error);
        } else {
            var processId = persistentData.processInstanceId;
            var query = {processInstanceId: processId};
            var fields = {}; // all fields
            db.find(query, fields, function(err, documents) {
                if (documents && documents.length > 0) {
                    if (documents.length === 1) {
                        persistentData._id = documents[0]._id;
                        db.update(persistentData, function(error, updatedData) {
                            if(error) {
                                done(error);
                            } else {
                                done(null, updatedData);
                            }
                        });
                    } else {
                        // TODO improve error mechanism
                        done(new Error("Process ID: '" + processId + "' is not unique in the DB"));
                    }
                } else {
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

Persistency.prototype.load = function(processInstanceId, done) {
    var db = this.db;

    db.connect(this.path, function(error) {
        if(error) {
            done(error);
        } else {
            var query = {processInstanceId: processInstanceId};
            var fields = {}; // all fields
            db.find(query, fields, function(err, documents) {
                if (documents && documents.length > 0) {
                    if (documents.length === 1) {
                        if(error) {
                            done(error);
                        } else {
                            done(null, documents[0]);
                        }
                    } else {
                        // TODO improve error mechanism
                        done(new Error("Persistency: Process ID: '" + processInstanceId + "' is not unique in the DB"));
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
 * @param {Boolean} persistToFile
 * @return {{connect: Function, insert: Function, update: Function, find: Function, findById: Function}} interface compliant to mongodb
 */
exports.getDB = getDB = function(persistToFile) {
    var db;
    if (persistToFile) {
      db = new JaguarDb();
    } else {
        throw Error("Only file persistency is supported yet");
    }
    return db;
};

Persistency.prototype.cleanAllSync = function() {
    if (this.path) {
        fileUtilsModule.cleanDirectorySync(this.path);
    }
};