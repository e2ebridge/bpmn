/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

var mongodb = require('mongodb');

// details see http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
var options = {
    server: {
        auto_reconnect: true,
        poolSize: 1,
        socketOptions: {
            connectTimeoutMS: 5000
        }
    }
};

/*
 * We have one global connection.
 * We follow the advice of the inventor of the MongoClient:
 *   "You open do MongoClient.connect once when your app boots up and reuse the db object. It's not a singleton connection pool each .connect creates a new connection pool. So open it once an reuse across all requests."
 *   Source: https://groups.google.com/forum/#!msg/node-mongodb-native/mSGnnuG8C1o/Hiaqvdu1bWoJ
 */
var globalDbConnection = null;

/**
 * @param {String} uri
 * @constructor
 */
function Persistency(uri) {
    if (uri) {
        this.uri = uri;
    } else {
        throw Error("MongoDB: Persistency: requires uri to db");
    }
 }
exports.Persistency = Persistency;

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function} done
 */
Persistency.prototype.persist = function(persistentData, done) {
    if (globalDbConnection) {
        persist(globalDbConnection, persistentData, done);
    } else {
        mongodb.MongoClient.connect(this.uri, options, function(error, db) {
            if(error) {
                globalDbConnection = null;
                db.close();
                done(error);
            } else {
                globalDbConnection = db;
                persist(db, persistentData, done);
            }
        });
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
    if (globalDbConnection) {
        globalDbConnection.close(true, function(error) {
            globalDbConnection = null;
            done(error);
        });
    } else {
        done();
    }
};
