var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var users = require('./users');


function generate_messages(req, res) {


	if (users.user_enrolled(req)) {
		if (req.params.course === 'cse442-f17') {
			req.flash('course_info', 'Form your team');
		} else if (req.params.course === 'cse115-f17') {
			req.flash('course_info', 'Upcoming deadline');
		}
	}


}

exports.render_content = render_content = function render_content(req, res, type, param) {
	preprocess_course(req, res, function (req, res, course) {
		var content = {};
		for (var i in course[type]) {
			var this_thing = course[type][i];
			if (this_thing.short_title === param) {
				content = this_thing;
				break;
			}
		}
		res.to_template.content = content;
		res.render(type, res.to_template);
	});
};


exports.preprocess_course = preprocess_course = function preprocess_course(req, res, next) {

	// Messages to students
	if (!req.session.flash || !req.session.flash.course_info) {
		generate_messages(req, res);
	}

	db.get('course_content').findOne({'course': req.params.course}, {}, function (err, record) {
		if (err) {
			console.log(err);
			req.flash('error', 'Course not found ' + err);
			res.redirect('/courses/');
		} else if (!record) {
			req.flash('error', 'Course not found');
			res.redirect('/courses/');
		} else {
			res.to_template.course = record;
			next(req, res, record);
		}
	});
};
