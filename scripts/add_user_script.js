//var mongo = require('mongodb');
//var monk = require('monk');
//var db = monk('localhost:27017/education');
//var collection = db.get('users');
//var log = require('winston');
//
//var bcrypt = require('bcryptjs');
//
//var username = process.argv[2];
//var password = process.argv[3];
//log.info(username + ": added with add_user_script");
//
//collection.findOne({'username': username}, function (err, user) {
//	if (err) {
//		console.log(err);
//		shut_it_down();
//	} else if (user) {
//		console.log('user already exists');
//		shut_it_down();
//	} else {
//		var salt = bcrypt.genSaltSync(10);
//		var hash = bcrypt.hashSync(password, salt);
//		collection.insert({'username': username, 'password': hash}, function (err, data) {
//			if (err) {
//				console.log(err);
//				shut_it_down();
//			} else {
//				console.log('user ' + username + ' added');
//				shut_it_down();
//			}
//		});
//	}
//
//});
//
//
//
//function shut_it_down() {
//	db.close();
//}