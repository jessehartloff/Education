var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

function and_you_get_a_multiplier(){
	var collection_ps = db.get('ps');
	collection_ps.update({},{$set:{"large_multipliers_remaining":0, "small_multipliers_remaining":2}},{multi:true}, function(){
		db.close();
	})
}

and_you_get_a_multiplier();