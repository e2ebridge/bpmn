var JaguarDb = require('./lib/jaguarDb').JaguarDb;
var options = {logging: true};
var db = new JaguarDb(options);

db.connect('./data', function(err) {

  if(err) {
    console.log('Could not connect: ' + err);
    return;
  }

  console.log('Connected!');

  var query = {title: 'hello world'};
  var fields = {_id: 1, title: 1};
  db.find(query, fields, function(err, documents) {
    if(err) {
      console.log('ERROR: ' + err);
      return;
    }

    console.log('Found %s documents', documents.length);
    console.dir(documents);
  });

  var idToFind = 2;
  db.findById(idToFind, function(err, document) {
    if (err) {
      console.log('ERROR: ' + err);
      return;
    }
    if (document == null) {
      console.log('Document %s was not found', idToFind);
      return;
    }
    console.log('Found document id %s', idToFind);
    console.dir(document);
  });

});




