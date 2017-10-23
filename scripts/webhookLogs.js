var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var collection = db.get('github_activity');


collection.find({}, {}, function (err, records) {
	console.log(records);
});

