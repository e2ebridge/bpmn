var path = require('path');
var fs = require('fs');
var util = require('./jaguarUtil');

var JaguarDb = function(options) {
  this.dbPath = null;
  this.indexFile = null;
  this.indexData = { nextId: 1, indexes: [], documents: [] };
  this.log = function(message) {};

  if(options != null && options.logging === true) {
    this.log = function(message) {
      console.log('jaguarDb: %s', message);
    }
  }
}


// ----------------------------------
// Connect to a database
// ----------------------------------
JaguarDb.prototype.connect = function(dbPath, cb) {
  this.log('Connecting to: ' + dbPath);
  this.dbPath = dbPath;
  this.indexFile = path.join(this.dbPath, 'index.json');
  var _this = this;
  
  // Check if the path exists and it's indeed a directory.
  fs.stat(dbPath, function(err, stat) {
    if (err) {
      if(err.code == 'ENOENT') {
        _this.log('Creating directory ' + _this.dbPath)
        fs.mkdirSync(_this.dbPath);  // FYI: blocking call
      }
      else {
        cb(err);
        return;
      }     
    }
    else {
      if(!stat.isDirectory()) {
        cb(_this.dbPath + " exists but it's not a folder!");
        return;
      }
    }

    _this._loadIndexData(_this, cb);
  });
}


// Internal method.
// Loads the "index.json" file to memory.
JaguarDb.prototype._loadIndexData = function(_this, cb) {
  fs.exists(_this.indexFile, function(exists) {
    if (exists) {

      fs.readFile(_this.indexFile, function(err, data) {
        if(err) {
          _this.log('Index file already exists, but could not be read.');
          cb(err);
        }
        else {
          _this.log('Index file read');
          _this.indexData = JSON.parse(data);
          cb(null);
        }
      });

    }
    else {

      // create index file
      _this.log('Creating index file: ' + _this.indexFile);
      fs.writeFile(_this.indexFile, JSON.stringify(_this.indexData), function(err) {
        if (err) {
          _this.log('ERROR', 'Could not create index file. Error: ' + err);
          cb(err);
        }
        else {
          _this.log('Index file created');
          cb(null);
        }
      });

    }
  });
}


// ----------------------------------------------------
// Inserts a new document in the database
// data is an object with the values to save.
// Notes: 
//    All values in this object are saved to the database.
//    An _id value will always be assigned to the data object 
//    before saving it (even if the object comes with one.)
// ----------------------------------------------------
JaguarDb.prototype.insert = function(data, cb) {
  this.log('About to insert');
  data._id = this.indexData.nextId;
  this.indexData.nextId++;

  // update index 
  var indexes = this.indexData.indexes;
  var indexDoc = { _id: data._id};
	for(var i=0; i<indexes.length; i++) {
		var indexField = indexes[i];
		indexDoc[indexField] = data[indexField];
	}
  this.indexData.documents.push(indexDoc);

  // Use blocking-write to make sure the document file
  // is created before we update the index.
  // Also use blocking-write to update the index.
  // Should change these to non-blocking once
  // I figure out how to prevent conflicts.
  try {
    var documentFile = path.join(this.dbPath, data._id.toString() + '.json');
    fs.writeFileSync(documentFile, JSON.stringify(data));
    this.log('Document inserted: ' + documentFile);
    
    fs.writeFileSync(this.indexFile, JSON.stringify(this.indexData));
    this.log('Index file updated');
    cb(null, data);
  }
  catch(err) {
    this.log('Error inserting:' + err);
    cb(err);
  }
  
}


// ----------------------------------------------------
// Updates an existing document in the database
// data is an object with the values to save.
// Notes: 
//    All values in this object are saved to the database.
//    The data object must come with an _id value and it must
//    match with an existing document.
// ----------------------------------------------------
JaguarDb.prototype.update = function(data, cb) {
	var i;

  this.log('About to update');
  if(data._id === undefined) {
    cb('No _id was found on document');
    return;
  }

  // find the document to update on the index
  var indexDoc = null;
	var documents = this.indexData.documents;
	for(i=0; i<documents.length; i++) {
		if(documents[i]._id === data._id) {
			indexDoc = documents[i];
			break;
		}
	}

	if(indexDoc === null) {
		cb("The _id to update [" + data._id + "] was not found.");
		return;
	}

	// update the document in the index
	var indexes = this.indexData.indexes;
	for(i=0; i<indexes.length; i++) {
		var indexField = indexes[i];
		indexDoc[indexField] = data[indexField];
	}

  var documentFile = path.join(this.dbPath, data._id.toString() + '.json');
  var _this = this;
  fs.writeFile(this.indexFile, JSON.stringify(this.indexData), function(err) {
    if (err) {
      _this.log('ERROR', 'Could not update index file. Error: ' + err);
      cb(err);
    }
    else {
      _this.log('Index file updated');
      // save full document
		  fs.writeFile(documentFile, JSON.stringify(data), function(err) {
		    if (err) {
		      _this.log('ERROR', 'Could not update document. Error: ' + err);
		      cb(err);
		    }
		    else {
		      _this.log('Document updated: '+ documentFile);
		      cb(null, data);
		    }
		  });
		}
	});
}


// ----------------------------------
// Find documents in the database
//
// Query is an object with the fields and values that will be
// used to filter which documents will be selected.
//    query = {fieldA: 'some value'}
//
// Fields is an object with the fields that will be selected.
//    fields = {fieldA: 1, fieldB: 1, fieldX: 1}
//
// cb is a callback that will be called with the following
// arguments: (err, documents)
//
// ----------------------------------
JaguarDb.prototype.find = function(query, fields, cb) {
  query = query || {};    // default to select all documents
  fields = fields || {};  // default to select all fields

  var isFindAll = util.isEmptyObject(query);
  if(isFindAll) {
    this._getAll(fields, cb); 
    return;
  }

  this._getSome(query, fields, cb);
}


// Internal method.
// Fetches all documents in the database.
// See find() for more information.
//
// Notes: 
//    This method blocks if the fields selected are not in the indices!
//    Eventually I want to make it async.
JaguarDb.prototype._getAll = function(fields, cb) {
  var i, _id, file, text, document;
  var documents = this.indexData.documents;
  var indexes = this.indexData.indexes;
  var selectFields = Object.getOwnPropertyNames(fields);
  var foundDocs = [];
  var isCoveredFields = false;

  if(!util.isEmptyObject(selectFields)) {
    isCoveredFields = util.isCoveredQuery(indexes, selectFields);
  }

  if(isCoveredFields) {
    // We've got all the data that we need in the indexes.
    this.log('getAll (covered query)');
    for(i=0; i<documents.length; i++) {
      document = documents[i];
      foundDocs.push(document);
    }
    util.projectFields(foundDocs, fields, cb);
    return;
  }

  // Worse case scenario. Read the full document for all 
  // documents because the fields requested are not in 
  // the index.
  this.log('getAll (full table scan)');
  for(i=0; i<documents.length; i++) {
    _id = documents[i]._id;
    file = path.join(this.dbPath, _id.toString() + '.json');
    text = fs.readFileSync(file); // Blocking call
    document = JSON.parse(text);
    foundDocs.push(document);
  }
  util.projectFields(foundDocs, fields, cb);

}


// Internal method.
// Fetches a subset of the documents in the database.
// See find() for more information.
//
// Notes: 
//    This method blocks if the fields selected or the field
//    to query by are not in the indices!
//    Eventually I want to make it async.
//
//    Only exact matches on queries are supported 
//    (i.e. field = 'value')
//    Other types of queries are NOT supported yet. 
//    (i.e. field != value or field >= 'value')
JaguarDb.prototype._getSome = function(query, fields, cb) {
  var _id, file, text, document, i;
  var documents = this.indexData.documents;
  var indexes = this.indexData.indexes;
  var queryFields = Object.getOwnPropertyNames(query);
  var selectFields = Object.getOwnPropertyNames(fields);
  var foundDocs = [];

  var isCoveredQuery = util.isCoveredQuery(indexes, queryFields);
  var isCoveredFields = util.isCoveredQuery(indexes, selectFields);

  if(isCoveredQuery && isCoveredFields) {
    // Query and selection can be satisfied with the index alone
    // and therefore we don't need to read full documents at all!
    this.log('getSome (covered query)');
    for(i=0; i<documents.length; i++) {
      document = documents[i];
      if(util.isMatch(document, queryFields, query)) {
        foundDocs.push(document);
      }
    }
    util.projectFields(foundDocs, fields, cb);
    return;
  }

  if(isCoveredQuery) {
    // Query can be satisfied with the indexes but not
    // the data selection. Read the full document only 
    // for those documents that meet the query criteria.
    this.log('getSome (partial table scan)')
    for(i=0; i<documents.length; i++) {
      document = documents[i];
      if(util.isMatch(document, queryFields, query)) {
        // read the full document 
        _id = documents[i]._id;
        this.log('reading full document %s', _id);
        file = path.join(this.dbPath, _id.toString() + '.json');
        text = fs.readFileSync(file); // Blocking call
        document = JSON.parse(text);
        foundDocs.push(document);
      }
    }
    util.projectFields(foundDocs, fields, cb);
    return;
  }

  // Worse case scenario. Read the full document for all 
  // documents because the query cannot be satisfied 
  // with the indexes.
  this.log('getSome (full table scan)')
  for(i=0; i<documents.length; i++) {
    _id = documents[i]._id;
    file = path.join(this.dbPath, _id.toString() + '.json');
    text = fs.readFileSync(file); // Blocking call
    document = JSON.parse(text);
    if(util.isMatch(document, queryFields, query)) {
      foundDocs.push(document);
    }
  }
  util.projectFields(foundDocs, fields, cb);

}


// ----------------------------------------
// Find one document in the database by Id.
// All the fields of the document are read. 
// ----------------------------------------
JaguarDb.prototype.findById = function(id, cb) {
  // Go straight after the file with the document
  // information (i.e. don't even bother looking 
  // at the index.)
  var file = path.join(this.dbPath, id.toString() + '.json');   
  fs.readFile(file, function(err, text) {
    if(err) {
      if(err.code === 'ENOENT') {
        cb(null, null); // document not found
      }
      else {    
        cb(err); // a true other error
      }
    }
    else {
      var document = JSON.parse(text);
      cb(null, document);
    }
  });
}


JaguarDb.prototype.findByIdSync = function(id) {
  // Go straight after the file with the document
  // information (i.e. don't even bother looking 
  // at the index.)
  var file = path.join(this.dbPath, id.toString() + '.json');   
  if(!fs.existsSync(file)) {
    return null;
  }
  var text = fs.readFileSync(file);
  var document = JSON.parse(text);
  return document;
}


// ----------------------------------
// Create an index
// Field is a string with the name of the field to index.
// When force is true the index will be recreated if already
// exists. When force is false the index will only be created
// if it does not exist already.
// ----------------------------------
JaguarDb.prototype.ensureIndexSync = function(field, force) {
	
	if(this.indexData.indexes.indexOf(field) == -1) {
		this.indexData.indexes.push(field);
	}
	else {
		// index is already been created 
		if(force !== true) {
			return;
		}
	}

	this.log("Populating index [" + field + "]...");	
	for(i=0; i<this.indexData.documents.length; i++) {
		var indexDoc = this.indexData.documents[i];
		var doc = this.findByIdSync(indexDoc._id);
		indexDoc[field] = doc[field];
	}

	this.log("Saving index [" + field + "]...");
  fs.writeFileSync(this.indexFile, JSON.stringify(this.indexData));
  this.log("Index created.")
}


exports.JaguarDb = JaguarDb;