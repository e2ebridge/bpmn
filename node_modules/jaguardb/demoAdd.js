var JaguarDb = require('./lib/jaguarDb').JaguarDb;
var options = {logging: true};
var db = new JaguarDb(options);

db.connect('./data', function(err) {

	if(err) {
		console.log('Could not connect: ' + err);
		return;
	}

	console.log('Connected!');

	var data = {title: 'hello', content: 'blah blah blah'};
	db.insert(data, function(err, insertedData) {

		if(err) {
			console.log('ERROR: ' + err);
			return;
		}

		console.log('Inserted');
		console.dir(insertedData);

		updatedData = insertedData;
		updatedData.title = 'hello world';
		updatedData.content = 'blah-blah-blah-blah';
		updatedData.insertedOn = new Date();
		db.update(updatedData, function(err) {
		
			if(err) {
				console.log('ERROR: ' + err);
				return;
			}

			console.log('Updated');
			console.dir(updatedData);
		});

	});

});




