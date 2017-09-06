var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var user_collection = db.get('users');
var course_collection = db.get('course_content');

var bcrypt = require('bcryptjs');

exports.user_enrolled = function user_enrolled(req){
	return req.user && req.params.course && req.user.courses_enrolled && req.user.courses_enrolled[req.params.course];
};

exports.enroll = function enroll_in_course(username, course) {
	course_collection.findOne({'course': course}, {}, function (err, record) {
		if (err) {
			console.log(err);
		} else if (!record) {
			console.log('course not found: ' + course);
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
};


//var username = 'sophie';
//user_collection.update({'username':username}, {$unset:{'courses_enrolled':"", 'options':""}});
//exports.enroll(username, 'cse442-f17');