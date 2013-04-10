jaguarDb
================
The simplest in-process database for Node.js that could possible work. 

This library provides the ability to store information in a Node.js application emulating a simple document-oriented database and without requiring an external process to be running.

The goal is to provide a quick and dirty way of storing information for small prototypes and unit testing. Do not use this to power your web site or the next eBay.

The API mimics MongoDB’s API to allow for easy migration of applications using jaguarDb to a real database. Also, the fact the MongoDB has a kickass API makes it an great model to follow.

This database does not support transactions or any of the ACID properties. In fact you should not even consider it a database. It's basically a glorified wrapper around JSON.stringfy and JSON.parse tailored to mimic a database. 

The API for jaguarDb is asynchronous so that the code using it can easily migrated to use a real database. I might provide a synchronous API later on to make its use much simpler, particularly for unit tests or batch processes.

Installation
------------
The easiest way to install it is via NPM:

    npm install jaguardb

Alternatively you can download the jaguarDb.js and jaguarUtil.js files from this repo and reference them from your project.


Basic Samples
-------------
These following samples assume that you installed jaguarDb via NPM.

**demoAdd.js** shows how to add data to a brand new database.  

    var JaguarDb = require('jaguarDb').JaguarDb;
    var db = new JaguarDb();
    db.connect('./data', function(err) {
      if(err) {
        // handle error
        return;
      }
      var data = {title: 'hello', content: 'blah blah blah'};
      db.insert(data, function(err, insertedData) {
        // insertedData has the new document
      });
    });


**demoFind.js** shows how to query documents from the database. The basic structure is as follow: 

    var JaguarDb = require('jaguarDb').JaguarDb;
    var db = new JaguarDb();
    db.connect('./data', function(err) {
      if(err) {
        // handle error
        return;
      }
      var query = {}; // all records
      var fields = {}; // all fields
      db.find(query, fields, function(err, documents) {
        // your data is in the documents array
      });
    });

You can filter the documents by providing a query object with the fields and attributes to use to filter: The following example will select documents where the title is 'hello'

    var query = { title: 'hello' };


Sample using Express
--------------------
**demoExpress.js** shows how to use jaguarDb with Express.js. You need to install Express.js on your system via **npm install express** before running this example: 

    var express = require('express');
    var app = express();

    var JaguarDb = require('jaguarDb').JaguarDb;
    var db = new JaguarDb();

    db.connect('./data', function(err) {
      if(err) {
        console.log('Could not connect to database: ' + err);
        return;
      }
    });

    app.get('/', function(req, res){
      var query = {}; // all records
      var fields = {}; // all fields
      db.find(query, fields, function(err, docs) {
        if(err) {
          res.send('Error reading documents: ' + err);
          return;
        }
        // build HTML with your documents
        var html = "";
        res.send(html);
      });
    });


Storage
-------
Data is stored in one directory per database. A master file "index.json" contains the list of documents in the database plus other general information about the database (e.g. list of indexes, list of ids, and list of indexed values.) 

Each document is automatically assigned an _id field with a sequential value. 

One individual JSON file is created for each document, these files are named "n.json" where n is the value of the _id for the document.

The structure of the index.json file is more or less as follows:

    {
      "nextId":3,
      "indexes":["field1"],
      "documents":[
        {"_id":1,"field1":"valueA"},
        {"_id":2,"field1":"valueB"}
      ]
    }

The structure of a document file (say 1.json) is more or less as follows: 

    {"_id":1, "field1"":"valueA","content":"blah blah blah"}


Limitations (a lot)
-------------------
This library is meant to be used in a single-user environment as it has no multi-user provisions. 

Transactions are not supported.

No sorting or aggregations are provided.

The contents of the index.json file is kept in memory. This include the keys to all the documents and the values of the indexes.

Except for findById, all find operations are sequential (i.e. no binary tree or btree are used for searching.)

Althought the API is asynchronous, several of the operations **do block** while executing. 


Future enhancements
-------------------
Add support for complex queries. Currently only exact match queries are allowed.

    // This is currently supported
    // filter where fieldA == 'a' and fieldB == 'b'
    var query = {fieldA: 'a', fieldB: 'b'};

    // This is NOT currently supported
    // filter where fieldA == 'a' or fieldB == 'b'
    // filter where fieldA > 'a'


Allow for sorting operations.


Questions, comments, thoughts?
------------------------------
This is a very rough work in progress. 

Feel free to contact me at hector@hectorcorrea.com with questions or comments about this project.



