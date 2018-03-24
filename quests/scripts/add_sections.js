var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var collection_ps = db.get('ps');


function set_lab_section(username, section){
	collection_ps.findOne({username:username}, {}, function(err, user_ps){
		if(err || !user_ps){
			console.log("something went wrong");
		}else{
			collection_ps.update({username:username},{$set:{"lab_section":section}});
		}
	});
}

//var lab_sections = {
//	"hartloff": "A1"
//};
//
//for(var ubit in lab_sections){
//	console.log(ubit);
//	set_lab_section(ubit, lab_sections[ubit]);
//}
