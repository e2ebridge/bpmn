/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var FilePersistency = require('./file.js').Persistency;
var MongoDBPersistency = require('./mongodb.js').Persistency;

/**
 * @param {{uri: String, uri: String}} options
 * @constructor
 */
var Persistency = exports.Persistency = function(options) {
    var isMongoDbUri;
    var uri = options ? options.uri : null;

    if (uri) {
       isMongoDbUri = uri.indexOf('mongodb://') === 0;
       if (isMongoDbUri) {
           this.implementation = new MongoDBPersistency(uri, options);
       } else {
           this.implementation = new FilePersistency(uri);
       }
    } else {
        throw new Error("Persistency options must contain an uri property.");
    }
};

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function} done
 */
Persistency.prototype.persist = function(persistentData, done) {
    this.implementation.persist(persistentData, done);
};

/**
 * @param {String} processId
 * @param {String} processName
 * @param done
 */
Persistency.prototype.load = function(processId, processName, done) {
    this.implementation.load(processId, processName, done);
};

/**
 * @param {String} processName
 * @param done
 */
Persistency.prototype.loadAll = function(processName, done) {
    this.implementation.loadAll(processName, done);
};

/**
 * @param done
 */
Persistency.prototype.close = function(done) {
    this.implementation.close(done);
};
