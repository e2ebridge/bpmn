/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var fileUtils = require('../../../lib/utils/file.js');
var JaguarDb = require('jaguardb').JaguarDb;
var jaguarDbPath = './test/resources/persistency/testJaguardb';

exports.testJaguarDBInsert = function(test) {

    fileUtils.cleanDirectorySync(jaguarDbPath);

    var db = new JaguarDb();
    db.connect(jaguarDbPath, function(err) {
        if(err) {
            return;
        }
        var data = {title: 'hello', content: 'blah blah blah'};
        db.insert(data, function(err, insertedData) {
            if(err) {
                return;
            }
            test.deepEqual(insertedData,
                {
                    "title": "hello",
                    "content": "blah blah blah",
                    "_id": 1
                },
                "testJaguarDBInsert"
            );
            test.done();
        });
    });

    test.expect(1);
};

exports.testJaguarDBQuery = function(test) {

    var db = new JaguarDb();
    db.connect(jaguarDbPath, function(err) {
        if(err) {
            return;
        }
        var query = {}; // all records
        var fields = {}; // all fields
        db.find(query, fields, function(err, documents) {
            test.deepEqual(documents,
                [
                    {
                        "title": "hello",
                        "content": "blah blah blah",
                        "_id": 1
                    }
                ],
                "testJaguarDBQuery"
            );
            test.done();
        });
    });
};

exports.testJaguarDBUpdate = function(test) {

    var db = new JaguarDb();
    db.connect(jaguarDbPath, function(err) {
        if(err) {
            // handle error
            return;
        }
        var data = {
            "title": "hello",
            "content": "new content",
            "_id": 1
        };
        db.update(data, function(err, updatedData) {
            test.deepEqual(updatedData,
                {
                    "title": "hello",
                    "content": "new content",
                    "_id": 1
                },
                "testJaguarDBUpdate"
            );
            test.done();
        });
    });
};

exports.testJaguarDBFindById = function(test) {

    var db = new JaguarDb();
    db.connect(jaguarDbPath, function(err) {
        if(err) {
            return;
        }
        db.findById("1", function(err, updatedData) {
            test.deepEqual(updatedData,
                {
                    "title": "hello",
                    "content": "new content",
                    "_id": 1
                },
                "testJaguarDBFindById"
            );
            test.done();
        });
    });
};