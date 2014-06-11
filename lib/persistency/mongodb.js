/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var MongoClient = require('mongodb').MongoClient;
var EventEmitter = require('events').EventEmitter;

// details see http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
var defaultOptions = {
    "server": {
        // if we set this to true, we will try to reconnect even if the url is wrong.
        // So we can never close the connection if something went wrong
        // If this were true, the connectionNOK test will fail.
        "auto_reconnect": false,
        "poolSize": 10,
        "socketOptions": {
            "connectTimeoutMS": 5000
        }
    }
};

/*
 * We have one global connection.
 * We follow the advice of the inventor of the MongoClient:
 *   "You open do MongoClient.connect once when your app boots up and reuse the db object. It's not a singleton connection pool each .connect creates a new connection pool. So open it once an reuse across all requests."
 *   Source: https://groups.google.com/forum/#!msg/node-mongodb-native/mSGnnuG8C1o/Hiaqvdu1bWoJ
 */
var uniqueDbConnections = {};
var waitingForConnectionEventEmitters = {};
var connectionEventName = 'connectionEventName';

/**
 * @param {String} uri
 * @param {*} options
 * @constructor
 */
var Persistency = exports.Persistency = function(uri, options) {
    this.options = options || defaultOptions;
    this.options.server = this.options.server || defaultOptions.server;

    if (this.options.logger) {
        this._trace = this.options.logger.trace || function() {};
    } else {
        this._trace = function() {};
    }

    if (uri) {
        this.uri = uri;
    } else {
        throw new Error("MongoDB: Persistency: requires uri to db");
    }
};

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function} done
 */
Persistency.prototype.persist = function(persistentData, done) {
  this._execute(this._findAndModify, persistentData, done);
};

/**
 * @param {String} processId
 * @param {String} processName
 * @param done
 */
Persistency.prototype.load = function(processId, processName, done) {
    this._execute(this._find, {processId: processId, processName: processName}, done);
};

/**
 * @param {String} processName
 * @param done
 */
Persistency.prototype.loadAll = function(processName, done) {
    this._execute(this._findAll, processName, done);
};

/**
 * @param done
 */
Persistency.prototype.close = function(done) {
    var self = this;
    var connection = self._getConnection();

    if (connection) {
        connection.close(true, function(error) {
            self._resetConnection();
            done(error);
        });
    } else {
        done();
    }
};

/**
 * @param {Function} dbCall
 * @param {*} argument
 * @param {Function} done
 */
Persistency.prototype._execute = function(dbCall, argument, done) {
    var waitingForConnection;
    var self = this;
    var connection = self._getConnection();

    if (connection) {
        self._trace("\nUsing existing connection '" + connection.databaseName + "'");
        dbCall.call(self, connection, argument, done);
    } else {
        waitingForConnection = self._waitingForConnection();
        if (waitingForConnection) {
            self._trace("Waiting for connection. URI: " + self.uri);
            waitingForConnection.on(connectionEventName, function(error, db) {
                if (error) {
                    self._resetConnection();
                    self._trace("ERROR: Stopped waiting for connection. URI: " + self.uri + " Error: " + error);
                    done(error);
                } else {
                    self._trace("Stopped waiting. Got connection '" + db.databaseName + "'.");
                    dbCall.call(self, db, argument, done);
                }
             });
        } else {
            self._setWaitingForConnection();
            self._trace("Trying to get connection for URI: " + self.uri + " ...");
            self._connect(function(error, db) {
                var waitingForConnection = self._waitingForConnection();

                if(error) {
                    self._trace("ERROR: Could not get connection. URI: " + self.uri + " Error: " + error);
                    waitingForConnection.emit(connectionEventName, error); // we do this to stop waiting
                    self._resetConnection();
                    if (db){
                        db.close(function() {
                            done(error);
                        });
                    } else {
                        done(error);
                    }
                } else {
                    self._trace("Got connection '" + db.databaseName + "' URI: " + self.uri);
                    self._setConnection(db);
                    waitingForConnection.emit(connectionEventName, null, db);
                    dbCall.call(self, db, argument, done);
                }
            });
        }
     }
 };

Persistency.prototype._connect = function(done) {
    MongoClient.connect(this.uri, this.options, done);
};

/**
 * @returns {*}
 * @private
 */
Persistency.prototype._getConnection = function() {
    return uniqueDbConnections[this.uri];
};

/**
 * @param {*} connection
 * @private
 */
Persistency.prototype._setConnection = function(connection) {
    uniqueDbConnections[this.uri] = connection;
};

/**
 * @returns {EventEmitter}
 * @private
 */
Persistency.prototype._waitingForConnection = function() {
    return waitingForConnectionEventEmitters[this.uri];
};

/**
 * @private
 */
Persistency.prototype._setWaitingForConnection = function() {
    waitingForConnectionEventEmitters[this.uri] = new EventEmitter();
};

/**
 * @private
 */
Persistency.prototype._resetConnection = function() {
    delete uniqueDbConnections[this.uri];
    delete waitingForConnectionEventEmitters[this.uri];
};

/**
 * @param db
 * @param query
 * @param done
 * @private
 */
Persistency.prototype._find = function(db, query, done) {
    var self = this;
    var processId = query.processId;
    var processName = query.processName;
    var collection = db.collection(processName);

    self._trace("Start finding '" + processName + "' ('" + processId + "').");

    collection.find({processId: processId})
        .limit(2) // just 2 to find out weather we really found more than one document (see error below)
        .toArray(function(error, documents) {
            var size, errorMessage;

            if(error) {
                self._trace("Couldn't find '" + processName + "' ('" + processId + "'). Error: '" + error + "'.");
                done(error);
            } else {
                size = documents.length;
                if (size === 0) {
                    self._trace("Didn't find '" + processName + "' ('" + processId + "').");
                    done();
                } else if (size === 1) {
                    self._trace("Found '" + processName + "' ('" + processId + "').");
                    done(null, documents[0]);
                } else {
                    errorMessage = "Found more than one process of " + processName + "' ('" + processId + "').";
                    self._trace("ERROR '" + errorMessage + "'");
                    done(new Error(errorMessage));
                }
            }
        }
    );
};

/**
 * @param db
 * @param processName
 * @param done
 * @private
 */
Persistency.prototype._findAll = function(db, processName, done) {
    var self = this;
    var collection = db.collection(processName);

    self._trace("Start finding '" + processName + ".");

    collection.find({})
        .toArray(function(error, documents) {

            if(error) {
                self._trace("Couldn't find '" + processName + ". Error: '" + error + "'.");
                done(error);
            } else {
                done(null, documents);
            }
        }
    );
};

/**
 * @param db
 * @param persistentData
 * @param done
 * @private
 */
Persistency.prototype._findAndModify = function(db, persistentData, done) {
    var self = this;
    var processId = persistentData.processId;
    var processName = persistentData.processName;
    var collection = db.collection(processName);

    self._trace("Start persisting '" + processName + "'");

    collection.findAndModify(
        {processId: processId},
        [['_id','desc']], // if processId is not unique we take the latest one
        persistentData,
        {"upsert": true, "new": true}, // upsert: if not yet persisted insert data, otherwise update; new: return updated document
        function(error, document) {
            if(error) {
                self._trace("Couldn't persist '" + processName + "' ('" + processId + "'). Error: '" + error + "'.");
                done(error);
            } else {
                persistentData._id = document._id;
                self._trace("Persisted '" + processName + "' ('" + processId + "').");
                done(null, document);
            }
        }
    );
};

