/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

var MongoClient = require('mongodb').MongoClient;
var EventEmitter = require('events').EventEmitter;

// details see http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
var defaultOptions = {
    server: {
        "auto_reconnect": true,
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
var uniqueDbConnection = null;
var waitingForConnection = null;

/**
 * @param {String} uri
 * @param {Logger} logger
 * @param {*} options
 * @constructor
 */
function Persistency(uri, logger, options) {
    this.logger = logger;
    this.options = options || defaultOptions;
    if (uri) {
        this.uri = uri;
    } else {
        throw new Error("MongoDB: Persistency: requires uri to db");
    }
}
exports.Persistency = Persistency;

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function} done
 */
Persistency.prototype.persist = function(persistentData, done) {
    var self = this;
    var connectionEvent = 'connectionEvent';

    if (uniqueDbConnection) {
        persist(uniqueDbConnection, persistentData, done);
    } else {
        if (waitingForConnection) {
            waitingForConnection.on(connectionEvent, function(error) {
                if (!error) {
                    persist(uniqueDbConnection, persistentData, done);
                }
             });
        } else {
            waitingForConnection = new EventEmitter();
            MongoClient.connect(self.uri, self.options, function(error, db) {
                if(error) {
                    uniqueDbConnection = null;
                    waitingForConnection.emit(connectionEvent, error);
                    db.close();
                    done(error);
                } else {
                    uniqueDbConnection = db;
                    waitingForConnection.emit(connectionEvent);
                    persist(db, persistentData, done);
                }
            });
        }
     }
 };

function persist(db, persistentData, done) {
    var processId = persistentData.processId;
    var processName = persistentData.processName;
    var collection = db.collection(processName);
    collection.update({processId: processId}, persistentData, {upsert: true}, function(error, document) {
        persistentData._id = document._id;
        if(error) {
            done(error);
        } else {
            done(null, document);
        }
    });
}

/**
 * @param {String} processInstanceId
 * @param done
 */
Persistency.prototype.load = function(processInstanceId, done) {
    // TODO
    done();
};

/**
 * @param done
 */
Persistency.prototype.close = function(done) {
    if (uniqueDbConnection) {
        uniqueDbConnection.close(true, function(error) {
            uniqueDbConnection = null;
            done(error);
        });
    } else {
        done();
    }
};
