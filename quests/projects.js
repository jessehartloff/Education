var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var level_requirements = require('./level_requirements/requirements');

var collection_ps = db.get('ps');


// entry point
exports.get_hw = function get_hw(req, res, course) {
	if (!req.user) {
		res.render('questions/hw', res.to_template);
	} else {
		collection_ps.findOne({"username": req.user.username}, {}, function (err, user_ps) {
			if (err) {
				console.log("database error in get_ps: " + err);
				req.flash("error", "Database error 1");
				res.render('questions/hw', res.to_template);
			} else if (!user_ps) {
				console.log("user not enrolled for problem sets: " + req.user.username);
				req.flash("error", "User " + req.user.username + " is not registered for this feature. If you are enrolled in CSE115 send and email to hartloff@buffalo.edu with the subject \"CSE115 Problem Set Registration\" immediately to unlock problem sets");
				res.render('questions/hw', res.to_template);
			} else {
				res.to_template.user_ps = user_ps;


				res.to_template.level_name = level_requirements.get_level_requirements(user_ps.level).level_name;

				// ship it
				res.render('questions/hw', res.to_template);
			}
		});
	}
};