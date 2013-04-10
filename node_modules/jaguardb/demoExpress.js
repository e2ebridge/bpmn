var express = require('express');
var app = express();

var JaguarDb = require('./lib/jaguarDb').JaguarDb;
var db = new JaguarDb({logging:true});

db.connect('./data', function(err) {
  if(err) {
    console.log('Could not connect to database: ' + err);
    return;
  }

  db.ensureIndexSync('title');
});

app.use(express.bodyParser());


// Add a new topic
app.get('/new', function(req, res){
  var newTopic = {title: 'enter title', content: 'enter content here'};
  db.insert(newTopic, function(err, doc) {
    if(err) {
      console.dir(err);
      res.send('There was an error adding new topic');
    }
    else {
      res.redirect('/' + doc._id + '/edit');
    }
  });
});


// Edit an existing topic
app.get('/:id/edit', function(req, res) {

  var id = req.params.id;
  db.findById(id, function(err, doc) {
    if(err) {
      console.dir(err);
      res.send('Error while looking for topic');
      return;
    }
    var html = '<p>' + 
      '<form id="edit" method="post">' + 
      '  <p>Title:<input type="text" name="title" value="' + doc.title + '"/></p>' +
      '  <p>Content:<br/>' + 
      '  <textarea rows="4" cols="50" name="content">' + doc.content + '</textarea></p>' +
      '  <input type="submit"/>' + 
      '</form>' + 
      '</p>';
    res.send(html)
  });

});


// Save changes to an existing topic
app.post('/:id/edit', function(req, res) {

  var id = parseInt(req.params.id,10);
  var data = {
    _id: id, 
    title: req.body.title, 
    content: req.body.content
  };
  db.update(data, function(err, doc) {
    if(err) {
      console.dir(err);
      res.send('There was an error saving the record');
      return;
    }
    res.redirect('/' + id);
  });

});


// Display one topic by id
app.get('/:id', function(req, res){

  var id = parseInt(req.params.id,10);
  db.findById(id, function(err, doc) {

    if(err) {
      console.log('error: ' + err);
      res.send('Error fetching document [' + id + ']. Error: ' + err);
      return;
    }

    if(doc === null) {
      console.log('not found: ' + id);
      res.send('Document id [' + id + '] was not found.');
      return;
    }
    var html = '<p>' + 
        '<b>id: ' + doc._id + '</b><br/>' +
        '<b>title:</b> ' + doc.title + '<br/>' +  
        '<b>content:</b> ' + doc.content + 
        '</p>' + 
        '<p><a href=/' + doc._id + '/edit>Edit</a></p>' + 
        '<p><a href=/>Home</a></p>';
    res.send(html);

  });
});


// Display all topics
app.get('/', function(req, res){

  var query = {};
  var fields = {title: 1};
  db.find(query, fields, function(err, docs) {

    if(err) {
      res.send('Error reading documents: ' + err);
      return;
    }

    var i;
    var html = "";
    if(docs.length === 0) {
      html = "<p>No topics have been added</p>"
    }
    else {
      for(i = 0; i<docs.length; i++) {
        var url = "<a href=/" + docs[i]._id + " >" + docs[i].title + "</a>"
        html += '<p>' + 
          '<b>id: ' + docs[i]._id + '</b><br/>' +
          '<b>title:</b> ' + url + '<br/>' +  
          '</p>';
      }
    }
    html += '<p><a href=/new >Add new topic</a></p>';
    res.send(html);
  });
});


console.log("Server started http://localhost:3000");
app.listen(3000);





