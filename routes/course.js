var express = require('express');
var router = express.Router();

// TODO: Enroll students in course
// TODO: Display student options in user page for each enrolled course
// TODO: In course, if user && user is enrolled in this course, display certain content
// TODO: Projects page with voting and all that
// TODO: Students can join groups and edit their group's content
// TODO: Groups in a database. Separate from course since that gets wiped constantly
// TODO: User roles and different views for Student/TA/Instructor

// TODO: Q&A tied to lecture sections

// TODO: Change deadline on a per lab basis

router.use(function (req, res, next) {
	next();
});


router.get('/', function (req, res) {
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


// Project routes
router.get('/:course/project/:project', function (req, res) {
	var db = req.db;
	var collection = db.get('course_content');
	collection.findOne({'course': req.params.course}, {}, function (err, record) {
		if (err) {
			console.log(err);
			res.render('error');
		}
		res.to_template.course = record;
		db.get('projects').findOne({
			'course': req.params.course,
			'team_id': req.params.project
		}, {}, function (err, this_project) {
			if(err){
				//
			}else if(!this_project){
				req.flash('error', 'Invalid project ID');
				res.redirect('/courses/' + req.params.course + '/projects');
			}else{
				res.to_template.project = this_project;
				res.render('projects/single_project', res.to_template);
			}
		});
	});
});

router.get('/:course/projects', function (req, res) {
	var db = req.db;
	var collection = db.get('course_content');
	var course = req.params.course;
	collection.findOne({'course': course}, {}, function (err, record) {
		if (err) {
			console.log(err);
			res.render('error');
		} else if (!record) {
			console.log('course not found');
		} else if (record.project && record.project === 'old') {
			res.to_template.course = record;
			res.to_template.projects = record.projects;
			res.render('projects/projects_archived', res.to_template);
		} else {
			// TODO: Update with new projects schema
			if (res.to_template.user && res.to_template.user.courses_enrolled[course]) {
				res.to_template.user.course_options = res.to_template.user.courses_enrolled[course].options;
			}
			res.to_template.course = record;
			var projects_collection = db.get('projects');
			projects_collection.find({'course': course}, {}, function (err, all_projects) {
				res.to_template.projects = all_projects;
				console.log(all_projects);
				res.render('projects/projects', res.to_template);
			});
		}
	});
});

router.get('/:course/create-project', function (req, res) {
	var db = req.db;
	var collection = db.get('course_content');
	var course = req.params.course;
	collection.findOne({'course': course}, {}, function (err, record) {
		if (err) {
			console.log(err);
			res.render('error');
		} else if (!record) {
			console.log('course not found');
		} else {
			res.to_template.course = record;
			if (res.to_template.user && res.to_template.user.courses_enrolled[course]) {
				res.render('projects/create_project', res.to_template);
			} else {
				req.flash('error', 'You are not enrolled in this course');
				res.redirect('/courses/' + course + '/projects');
			}
		}
	});
});

router.post('/:course/create-project', function (req, res) {
	var db = req.db;
	var collection = db.get('course_content');
	var course = req.params.course;
	if (req.body.project_name && req.body.team_name) {
		collection.findOne({'course': course}, {}, function (err, record) {
			if (err) {
				console.log(err);
				res.render('error');
			} else if (!record) {
				console.log('course not found');
			} else {
				res.to_template.course = record;
				if (res.to_template.user && res.to_template.user.courses_enrolled[course]) {
					create_group(req.body.project_name, req.body.team_name, course, res.to_template.user.username, db);

					var team_id = req.body.team_name.toLowerCase().trim().replace(/\s+/g, '-');
					var set_string = 'courses_enrolled.' + course + '.options.group.value';
					var to_set = {$set: {}};
					to_set.$set[set_string] = team_id;

					collection.update({'username': req.user.username}, to_set);

					req.flash('success', 'Project ' + req.body.project_name + ' by ' + req.body.team_name + ' has been created');
					res.redirect('/courses/' + course + '/projects');
				} else {
					req.flash('error', 'You are not enrolled in this course');
					res.redirect('/courses/' + course + '/projects');
				}
			}
		});
	}

});

function create_group(project_name, team_name, course_id, founding_member, db) {
	// Convert project name to url param (remove all non-safe chars, toLower, dashes for spaces) [check for name conflicts]
	var projects_collection = db.get('projects');
	var team_id = team_name.toLowerCase().trim().replace(/\s+/g, '-');
	// TODO: check if ID exists
	projects_collection.insert({
		'team_id': team_id,
		'course': course_id,
		'team_name': team_name,
		'members': [founding_member],
		'project_name': project_name,
		'project_description': '',
		'landing_page_link': '',
		'repository_link_primary': '',
		'additional_repository_links': [],
		'communication_channel': '',
		'video_submissions': {},
		'beta_testing': {},
		'ratings': {}
	})
}

// end project routes


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
		} else if (!record) {
			// TODO: course not found
		} else {

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
		}
	});
}


router.get('/:course/*', function (req, res) {
	render_content(req, res, 'extra', 'syllabus');
});

module.exports = router;