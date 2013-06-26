/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var mongodb = require('mongodb');


/**
 * @param String uri
 * @constructor
 */
function MongoDBPersistency(uri) {
    if (uri) {
        this.uri = uri;
    } else {
        throw Error("MongoDBPersistency: requires uri to DB");
    }
 }
exports.MongoDBPersistency = MongoDBPersistency;

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function} done
 */
MongoDBPersistency.prototype.persist = function(persistentData, done) {
    var db = this.db;

    mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
        if(error) {
            done(error);
        } else {
            var processId = persistentData.processId;
            var processName = persistentData.processName;
            var collection = db.collection(processName);
            collection.save(persistentData, function(error, documents) {
                persistentData._id = documents[0]._id;
                persistentData._saved = documents[0]._saved || Date.now();
                persistentData._updated = Date.now();
                if(error) {
                    done(error);
                } else {
                    done(null, insertedData);
                }
            });
        }
    });
};
