var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var collection_ps = db.get('ps');



function give_lab(username){
	collection_ps.findOne({username:username}, {}, function(err, user_ps){
		if(err || !user_ps){
			console.log("something went wrong");
		}else{
			collection_ps.update({username:username},{$set:{"labs.lab10.complete":true}});
		}
	});
}

var people = [];

for(var i=0; i<people.length; i++){
	var ubit = people[i];
	console.log(ubit);
	give_lab(ubit);
}