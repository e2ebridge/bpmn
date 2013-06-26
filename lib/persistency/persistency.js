/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var FilePersistency = require('./file.js').Persistency;
//var MongoDBPersistency = require('./mongodb.js').Persistency;

/**
 * @param {{path: String, uri: String}} options
 * @constructor
 */
function Persistency(options) {
    var path = options ? options.path : null;
    var mongoDbUri = options ? options.mongoDbUri : null;

    if (path) {
       this.implementation = new FilePersistency(path);
    } else if (mongoDbUri) {
       //this.implementation = new MongoDBPersistency(mongoDbUri);
    } else {
        throw new Error("Persistency options must either contains a file path or a mongoDB uri");
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
