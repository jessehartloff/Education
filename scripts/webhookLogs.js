var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var collection = db.get('github_activity');
var fs = require('fs');


collection.find({}, {}, function (err, records) {
	fs.writeFile('./logs.json', JSON.stringify(records, null, 2), function(err){
		console.log("done");
	});
	//console.log(records);
});

