var JaguarDb = require('./lib/jaguarDb').JaguarDb;
var options = {logging: true};
var db = new JaguarDb(options);

db.connect('./data', function(err) {

  if(err) {
    console.log('Could not connect: ' + err);
    return;
  }

  console.log('Connected!');
  db.ensureIndexSync('title');

  var data = {title: 'hello', content: 'blah blah blah', insertedOn: new Date()};
  db.insert(data, function(err, insertedData) {

    if(err) {
      console.log('ERROR: ' + err);
      return;
    }

    console.log('Inserted');
    console.dir(insertedData);

    // Query by a field in the index
    var query = {title: 'hello'};
    var fields = {title: 1};
    db.find(query, fields, function(err, docs) {
      if(err) {
        console.log('ERROR: ' + err);
        return;
      }
      console.log('%s documents found', docs.length);
      for(i=0; i<docs.length; i++) {
        console.dir(docs[i]);
      }
    });
    

  });

});




