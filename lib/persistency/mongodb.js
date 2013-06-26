/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

var mongodb = require('mongodb');

/**
 * @param {String} uri
 * @constructor
 */
function Persistency(uri) {
    if (uri) {
        this.uri = uri;
        this.db = null;
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
    var self = this;
    if (self.db) {
        persist(self.db, persistentData, done);
    } else {
        mongodb.MongoClient.connect(this.uri, function(error, db) {
            if(error) {
                self.db = null;
                db.close();
                done(error);
            } else {
                self.db = db;
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
    var self = this;
    if (self.db) {
        self.db.close(true, function(error) {
            self.db = null;
            done(error);
        });
    } else {
        done();
    }
};
