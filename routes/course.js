var express = require('express');
var router = express.Router();

var nodemailer = require('nodemailer');


// Check if a user is logged in
//router.use(function (req, res, next) {
//	console.log(req.user);
//	if (req.user) {
//		next();
//	} else {
//		res.redirect('/');
//	}
//});

router.get('/', function (req, res) {
	res.render('index', {
		'course_list': res.course_list
	});
});


router.get('/:course/lectures/:lecture', function (req, res) {
	render_content(req, res, 'lectures', req.params.lecture);
});

router.get('/:course/assignments/:assignment', function (req, res) {
	render_content(req, res, 'assignments', req.params.assignment);
});

router.get('/:course/projects', function (req, res) {
	var db = req.db;
	var collection = db.get('course_content');
	collection.findOne({'course': req.params.course}, {}, function (err, record) {
		if (err) {
			console.log(err);
			res.render('error');
		}
		res.render('projects', {
			'course': record,
			'course_list': res.course_list,
			'projects': record.projects
		});
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
		for(var i in record[type]){
			var this_thing = record[type][i];
			if(this_thing.short_title === param){
				content = this_thing;
				break;
			}
		}
		res.render(type, {
			'course': record,
			'course_list': res.course_list,
			'content': content
		});
	});
}


router.get('/:course/*', function (req, res) {
	render_content(req, res, 'extra', 'syllabus');
});

module.exports = router;