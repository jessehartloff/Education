var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var level_requirements = require('./level_requirements/requirements');

var collection_ps = db.get('ps');


// TODO: Labs. Get lab after it's been activated which I do manually at the end of the friday lecture
// TODO: They can only access the lab after swiping into lab. Before this, the lab shows, but is greyed out
// TODO: Each lab has a level recommendation and a warning/confirmation if they check out a lab for which they are under leveled


// entry point
exports.get_lab = function get_lab(req, res, course) {
	if (!req.user) {
		res.render('questions/lab', res.to_template);
	} else {
		collection_ps.findOne({"username": req.user.username}, {}, function (err, user_ps) {
			if (err) {
				console.log("database error in get_ps: " + err);
				req.flash("error", "Database error 1");
				res.render('questions/lab', res.to_template);
			} else if (!user_ps) {
				console.log("user not enrolled for problem sets: " + req.user.username);
				req.flash("error", "User " + req.user.username + " is not registered for this feature. If you are enrolled in CSE115 send and email to hartloff@buffalo.edu with the subject \"CSE115 Problem Set Registration\" immediately to unlock problem sets");
				res.render('questions/lab', res.to_template);
			} else {
				res.to_template.user_ps = user_ps;


				res.to_template.level_name = level_requirements.get_level_requirements(user_ps.level).level_name;

				// ship it
				res.render('questions/lab', res.to_template);
			}
		});
	}
};