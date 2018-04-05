var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var collection_ps = db.get('ps');

//function and_you_get_a_multiplier(){
//	collection_ps.update({},{$set:{"large_multipliers_remaining":0, "small_multipliers_remaining":2}},{multi:true}, function(){
//		db.close();
//	})
//}
//
//and_you_get_a_multiplier();


function add_small_multipliers(username, quantity){
	collection_ps.findOne({username:username}, {}, function(err, user_ps){
		if(err || !user_ps){
			console.log("something went wrong");
		}else{
			var small_multipliers = user_ps.small_multipliers_remaining + quantity;
			collection_ps.update({username:username},{$set:{"small_multipliers_remaining":small_multipliers}});
		}
	});
}

function add_large_multipliers(username, quantity){
	collection_ps.findOne({username:username}, {}, function(err, user_ps){
		if(err || !user_ps){
			console.log("something went wrong");
		}else{
			var large_multipliers = user_ps.large_multipliers_remaining + quantity;
			collection_ps.update({username:username},{$set:{"large_multipliers_remaining":large_multipliers}});
		}
	});
}
