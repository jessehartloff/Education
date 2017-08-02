var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var user_collection = db.get('users');
var course_collection = db.get('course_content');

var bcrypt = require('bcryptjs');


exports.enroll = function enroll_in_course(username, course) {
	course_collection.findOne({'course': course}, {}, function (err, record) {
		if (err) {
			console.log(err);
		} else if (!record) {
			console.log('course not found');
		} else {
			// iterate over student options and add them to the student under the course name
			user_collection.findOne({'username': username}, function (err, user_record) {
				if (err) {
					console.log(err);
				} else if (!user_record) {
					console.log('user not found');
				} else {
					console.log(JSON.stringify(user_record, null, 2));
					var course_string = 'courses_enrolled.' + course + '.course_key';
					var query = {
						'username': username
					};
					query[course_string] = course;
					user_collection.findOne(query, function (err, already_enrolled) {
						if (err) {
							console.log(err);
						} else if (already_enrolled) {
							console.log('user already in course');
						} else {
							var these_options = {};
							for (var i in record.student_options) {
								var this_option = record.student_options[i];
								these_options[this_option.key_name] = {
									'value': this_option.default_value,
									'is_required': this_option.is_required,
									'display_name': this_option.display_name
								};
							}
							var course_object = {
								'course_key': course,
								'course_name': record.number_upper + ": " + record.title + " - " + record.semester,
								'options': these_options
							};
							var set_string = 'courses_enrolled.' + course;
							var to_set = {$set: {}};
							to_set.$set[set_string] = course_object;
							user_collection.update({'username': username}, to_set);
						}
					})

				}
			});
		}
	});
}


//function change_data(username, course, data_name, new_value) {
//	user_collection.updateOne({'username': username}, {$set: {data_name: new_value}});
//}


//function random_temp_password(password_length) {
//	// FWIW, not cryptographically secure
//	var length = password_length || 10;
//	var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
//	var new_pass = '';
//	for (var i = 0; i < length; i++) {
//		new_pass += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
//	}
//	return new_pass;
//}
//
//function change_password(username, new_password) {
//	// assumes the update is authenticated
//	console.log('changing password for ' + username);
//	var hash = secure_password(new_password);
//	collection.updateOne({'username': username}, {$set: {'password': hash}});
//}
//
//function secure_password(password) {
//	var salt = bcrypt.genSaltSync();
//	var hash = bcrypt.hashSync(password, salt);
//	return hash;
//}
//
//function email_temp_password(email, temp_password) {
//	var transporter = nodemailer.createTransport({
//		host: 'localhost',
//		port: 25,
//		tls: {
//			rejectUnauthorized: false
//		}
//	});
//
//	// TODO: Send a link to change password with a token (verify account on first use), instead of email a plaintext password that they won't change
//
//	transporter.sendMail({
//		from: 'courses@cse.buffalo.edu',
//		replyTo: 'hartloff@buffalo.edu',
//		to: email,
//		subject: 'CSE Course: temporary password',
//		text: 'An account has been created for you to use for you CSE course.' +
//		'\n\nYour username is: ' + email_to_ubit(email) +
//		'\nYour temporary password is: ' + temp_password +
//		'\n\nPlease login and change this password.' +
//		'\nhttps://fury.cse.buffalo.edu/user/login'
//	});
//}
//
//function email_to_ubit(email) {
//	return email.trim().toLowerCase().split('@')[0];
//}

//var username = 'sophie';
//user_collection.update({'username':username}, {$unset:{'courses_enrolled':"", 'options':""}});
//exports.enroll(username, 'cse442-f17');