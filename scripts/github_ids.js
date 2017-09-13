var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var collection = db.get('users');


collection.find({"courses_enrolled.cse442-f17.course_key": "cse442-f17"}, {}, function (err, records) {
	var did_their_shit = [];
	var ids = [];
	for (var i in records) {
		var id = records[i]["courses_enrolled"]["cse442-f17"]["options"]["github_username"]["value"];
		var ubit = records[i]["username"];
		var team_id = "";
		if(records[i]["courses_enrolled"]["cse442-f17"]["options"]["team_id"]) {
			team_id = records[i]["courses_enrolled"]["cse442-f17"]["options"]["team_id"]["value"];
		}
		if (id === "") {
			continue;
		}
		if (did_their_shit.indexOf(id) !== -1) {
			continue;
		}
		if (ids.indexOf(id) === -1) {
			ids.push(id);
			console.log(ubit + "," + id + "," + team_id);
		}
	}
	console.log(ids);
	console.log(ids.length);
});

