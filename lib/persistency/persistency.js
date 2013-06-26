/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var FilePersistency = require('./file.js').Persistency;
var MongoDBPersistency = require('./mongodb.js').Persistency;

/**
 * @param {{uri: String, uri: String}} options
 * @constructor
 */
function Persistency(options) {
    var uri = options ? options.uri : null;

    if (uri) {
       var isMongoDbUri = uri.indexOf('mongodb://') === 0;
       if (isMongoDbUri) {
           this.implementation = new MongoDBPersistency(uri);
       } else {
           this.implementation = new FilePersistency(uri);
       }
    } else {
        throw new Error("Persistency options must either contains an uri");
    }
}
exports.Persistency = Persistency;

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function} done
 */
Persistency.prototype.persist = function(persistentData, done) {
    this.implementation.persist(persistentData, done);
};

/**
 * @param {String} processInstanceId
 * @param done
 */
Persistency.prototype.load = function(processInstanceId, done) {
    this.implementation.load(processInstanceId, done);
};
