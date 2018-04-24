var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var collection_ps = db.get('ps');

function get_attendance(week_begin_timestamp){
	var one_week = 7*24*60*60;
	var week_end_timestamp = week_begin_timestamp + one_week;
	collection_ps.find({}, {all_validations:1, username:1, lab_section:1, _id:0}, function(err, all_ps){
		if(err || !all_ps){
			console.log("something went wrong: " + err);
		}else{
			for(var i=0; i<all_ps.length; i++){
				var user_ps = all_ps[i];
				var all_validations = user_ps["all_validations"];
				if(all_validations) {
					for (var j = 0; j < all_validations.length; j++) {
						var this_validation = all_validations[j];
						//console.log(this_validation["timestamp"]/1000);
						var stamp = this_validation["timestamp"]/1000;
						if(stamp > week_begin_timestamp && stamp < week_end_timestamp){
							console.log(user_ps.username + "\t" + user_ps.lab_section);
							break;
						}
					}
				}
			}
		}
		db.close();
	});
}

var one_week = 7*24*60*60;
var april_15 = 1523764800-one_week;
get_attendance(april_15);