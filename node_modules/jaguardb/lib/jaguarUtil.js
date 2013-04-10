// Returns true if an object has no properties, e.g. {}
// stolen from http://stackoverflow.com/a/2673229/446681
var isEmptyObject = function (obj) {
  return Object.getOwnPropertyNames(obj).length === 0;
}


// Given a list of documents creates a new list of documents but
// only with the fields indicated in fieldsToProject.
var projectFields = function(documents, fieldsToProject, cb) {
  var isAllFields = isEmptyObject(fieldsToProject);
  if(isAllFields) {
    // No filter required, we are done.
    cb(null, documents);
    return;
  }

  var fields = Object.getOwnPropertyNames(fieldsToProject);
  if(fields.indexOf('_id') === -1) {
    // Make sure the _id field is always returned. 
    fields.push('_id');
  }

  var i, j;
  var filteredDocs = [];
  for(i=0; i<documents.length; i++) {

    var fullDoc = documents[i];
    var doc = {};
    for(j=0; j<fields.length; j++) {
      var field = fields[j];
      if(fullDoc.hasOwnProperty(field)) {
        doc[field] = fullDoc[field];
      }
    }

    filteredDocs.push(doc);
  }
  cb(null, filteredDocs);
}


// Returns true if the all the fields indicated are
// in the indexes array.
// 
// For example, if 
//    indexes = ["field1", "field2"]
//    fields = ["field1", "field3"]
// then this function will return false
//
var isCoveredQuery = function(indexes, fields) {
  if(indexes.length === 0) {
    return false;
  }
  var i;
  for(i = 0; i < fields.length; i++) {
    var field = fields[i];
    if(field == "_id") {
      continue;
    }
    if(indexes.indexOf(field) === -1) {
      return false;
    }
  }
  return true;
}


// See if the document matches the field & values passed. 
var isMatch = function(document, queryFields, queryValues) {
  var i;
  for(i = 0; i < queryFields.length; i++) {
    var field = queryFields[i];
    if(document.hasOwnProperty(field)) {
      if (document[field] !== queryValues[field]) {
        // Field present but values does not match.
        return false;
      }
    }
    else {
      // Field not present
      return false;
    }
  }
  return true;
} 


exports.isEmptyObject = isEmptyObject;
exports.projectFields = projectFields;
exports.isCoveredQuery = isCoveredQuery;
exports.isMatch = isMatch;

