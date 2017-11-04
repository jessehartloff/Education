var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var collection = db.get('github_activity');
var fs = require('fs');


collection.find({}, {}, function (err, records) {
	if(err){console.log(err);}
	console.log(records.length);
	var all_records;
	fs.writeFile('./logs.json', JSON.stringify(records.slice(0, 10000), null, 2), function(err2){
		if(err2){console.log(err2);}
		console.log("done");
	});
	//console.log(records);
});




//collection.find({}, {}, function (err, records) {
//	if(err){console.log(err);}
//	console.log(records.length);
//	var all_records;
//	fs.writeFile('./logs3.json', JSON.stringify(records.slice(20000, records.length), null, 2), function(err2){
//		if(err2){console.log(err2);}
//		console.log("done");
//	});
//	//console.log(records);
//});

