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


var people = ['fmdestin', 'ousmanka', 'guangxin', 'wmsaulon', 'blakebue', 'annakobi', 'njceccar', 'wp26', 'jenniech', 'spittaro', 'seanjone', 'sanairac', 'bs84', 'vbaziuk', 'alphonsu', 'jamiesau', 'jchen338', 'rejankow', 'yli55', 'jzheng47', 'szheng32', 'mmmcnaug', 'irclark', 'jalmazan', 'mvciacci', 'btmccann', 'djin3', 'elbiltek', 'abrewer2', 'ifrankli', 'bcastell', 'mpriley', 'ethanhul', 'mmcaccam', 'skylarla', 'averywei', 'ziaochen', 'oscarasb', 'aamcclin', 'vtattyba', 'dszczepa', 'wtmills', 'swreming', 'afcovert', 'temeosky', 'sethschu', 'dm235', 'apszolno', 'dannenro', 'djbrior', 'alexisse', 'anmolpat', 'cullenga', 'usmanhus', 'ibarry2', 'badisben', 'svreid2', 'gtcodign', 'narmeena', 'kendall5', 'mjspagna', 'jeandedi', 'mjolenic', 'susanpau', 'drewfiut', 'bjho', 'aarondie', 'bfrawley', 'afuchs2', 'dmbritta', 'jlvella', 'karencru', 'djwhite5', 'jconoh', 'votreesh', 'ldong7', 'zhang77', 'devonwan', 'hchen63', 'sterlynr', 'vtjutton', 'zdgandro', 'aarondom', 'sli84', 'ancruz', 'dylanmah', 'jlsanton', 'sjlevano', 'weikengf', 'jlau28', 'coyotero', 'gli24', 'epwood', 'yusong', 'sandrash', 'msillah', 'camilare', 'njchorda', 'jlu42', 'dhuang34', 'seanbras', 'cvlada', 'jrwelch2', 'ncolan', 'boyuanch', 'xueweiji', 'dtschill', 'lukekuch', 'rmichel', 'avrilall'];

for(var i=0; i<people.length; i++){
	var ubit = people[i];
	console.log(ubit);
	add_small_multipliers(ubit, 2);
	add_large_multipliers(ubit, 2)
}