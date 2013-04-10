console.log('All tests passed if this program ends with == OK ==');

var JaguarDb = require('./lib/jaguarDb').JaguarDb;
var db = new JaguarDb({logging:false});
var dbName = 'testdb';

db.connect(dbName, function(err) {
  if (err) throw 'Connect failed:' + err;
  runInsertTest();
});


var runInsertTest = function() {
  var timeStamp = new Date().toString();
  var random = Math.floor(Math.random() * 1000);
  var title = timeStamp + '[' + random + ']'
  var newDoc = {title: title, field2: 'two', field3: 'three'};
  db.insert(newDoc, function(err, insertedData) {
    if(err) throw 'Insert failed: ' + err;
    if(insertedData.title != title) throw 'Unexpected title found';
    runFindByIdTest(insertedData._id, insertedData.title);
  });
}


var runFindByIdTest = function(id, title) {
  db.findById(id, function(err, doc) {
    if(err) throw 'Find by id failed: ' + err;
    if(doc._id != id) throw 'Unexpected id found';
    if(doc.title != title) throw 'Unexpected title found';
    runFindByTitleTest(doc.title, id);
  });
}

var runFindByTitleTest = function(title, id) {
  var query = {title: title};
  var fields = {};
  db.find(query, fields, function(err, docs) {
    if(err) {
      throw 'Find by title failed: ' + err;
    }
    if(docs.length === 0) throw 'Find by title returned no documents';
    if(docs.length > 1) throw 'Find by title returned more than one document';
    if(docs[0]._id != id) throw 'Find by title returned unexpected id';
    if(docs[0].title != title) throw 'Find by title returned unexpected id';
    runUpdateTest(docs[0]);
  });
}

var runUpdateTest = function(doc) {
  doc.title = '(updated)' + doc.title;
  db.update(doc, function(err, updated) {
    if(err) throw 'Updated failed: ' + err;
    if(updated._id != doc._id) throw 'Unexpected id found';
    if(updated.title != doc.title) throw 'Unexpected title found';
    runUpdateInvalidTest();
  });
}

var runUpdateInvalidTest = function() {
  var newDoc = {title: 'new doc'};
  db.update(newDoc, function(err, updated) {
    // We expect an error because we tried to update
    // a document without an _id
    if(err === null) throw 'Invalid update did not report an error';
    runFindAllTest();
  });
}

var runFindAllTest = function() {
  db.find({}, {}, function(err, docs) {
    if(err) throw 'Find all failed: ' + err;
    if(docs.length <= 0) throw 'No records found';
    runFindSomeFieldsTest();
  });
}

var runFindSomeFieldsTest = function() {
  var query = {};
  var fields = {title: 1, field3: 1};
  db.find(query, fields, function(err, docs) {
    if(err) throw 'Find some fields failed: ' + err;
    if(docs[0]._id === undefined) throw 'Expected field _id was not found';
    if(docs[0].title === undefined) throw 'Expected field title was not found';
    if(docs[0].field3 === undefined) throw 'Expected field field3 was not found';
    if(docs[0].field2 != undefined) throw 'Unexpecte field field2 was found';
    runFindByTitleSomeFields(docs[0].title);
  });
}

var runFindByTitleSomeFields = function(title) {
  var query = {title: title};
  var fields = {title: 1, field3: 1};
  db.find(query, fields, function(err, docs) {
    if(err) throw 'Find some fields failed: ' + err;
    if(docs[0]._id === undefined) throw 'Expected field _id was not found';
    if(docs[0].title === undefined) throw 'Expected field title was not found';
    if(docs[0].field3 === undefined) throw 'Expected field field3 was not found';
    if(docs[0].field2 != undefined) throw 'Unexpecte field field2 was found';
    runAllTestPassed();
  });
}

var runAllTestPassed = function() {
  console.log('== OK ==');
}
