var express = require('express');
var router = express.Router();

//var nodemailer = require('nodemailer');


// Check if a user is logged in
//router.use(function (req, res, next) {
//	console.log(req.user);
//	if (req.user) {
//		next();
//	} else {
//		res.redirect('/');
//	}
//});

router.use(function (req, res, next) {
	next();
});

router.get('/', function (req, res) {
	//res.render('index', {
	//	'course_list': res.course_list,
	//	'user': req.user
	//});
	res.render('index', res.to_template);
});


router.get('/:course/lectures/:lecture', function (req, res) {
	render_content(req, res, 'lectures', req.params.lecture);
});

router.get('/:course/assignments/:assignment', function (req, res) {
	render_content(req, res, 'assignments', req.params.assignment);
});


// deeper dives API
router.get('/:course/deeper-dive/:concept/:topic', function (req, res) {
	var db = req.db;
	var collection = db.get('course_content');
	collection.findOne({'course': req.params.course}, {'deep_dives': 1}, function (err, record) {
			if (err) {
				console.log(err);
				res.render('error');
			} else {
				// can move this into the db query. Also, check for errors
				res.end(JSON.stringify(record['deep_dives'][req.params.concept][req.params.topic]));
			}
		}
	)
	;
});

// references API
router.get('/:course/reference/:lecture/:section', function (req, res) {
	var db = req.db;
	var collection = db.get('course_content');
	collection.findOne({'course': req.params.course}, {'lectures': 1}, function (err, record) {
		if (err) {
			console.log(err);
			res.render('error');
		} else {
			// SHOULD move this into the db query. Also, check for errors
			for (var i in record.lectures) {
				var lecture = record.lectures[i];
				if (lecture.short_title === req.params.lecture) {
					for (var j in lecture.sections) {
						var section = lecture.sections[j];
						if (section.title_lookup === req.params.section) {
							res.end(JSON.stringify(section));
						}
					}
				}
			}
			res.end(JSON.stringify({'title': '', 'content': ''}));
		}
	});
});


router.get('/:course/projects', function (req, res) {
	var db = req.db;
	var collection = db.get('course_content');
	collection.findOne({'course': req.params.course}, {}, function (err, record) {
		if (err) {
			console.log(err);
			res.render('error');
		}
		res.to_template.course = record;
		res.to_template.projects = record.projects;
		res.render(type, res.to_template);
		//res.render('projects', {
		//	'course': record,
		//	'course_list': res.course_list,
		//	'projects': record.projects
		//});
	});
});

router.get('/:course/:extra', function (req, res) {
	render_content(req, res, 'extra', req.params.extra);
});


function render_content(req, res, type, param) {
	var db = req.db;
	var collection = db.get('course_content');
	collection.findOne({'course': req.params.course}, {}, function (err, record) {
		if (err) {
			console.log(err);
			res.render('error');
		}
		var content = {};
		for (var i in record[type]) {
			var this_thing = record[type][i];
			if (this_thing.short_title === param) {
				content = this_thing;
				break;
			}
		}
		res.to_template.course = record;
		res.to_template.content = content;
		res.render(type, res.to_template);
	});
}


router.get('/:course/*', function (req, res) {
	render_content(req, res, 'extra', 'syllabus');
});

module.exports = router;