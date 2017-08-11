var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

//var course_util = require('course');

var project_schema = {
	'course': '',
	'team_name': '',
	'members': [],
	'project_name': '',
	'project_description': '',
	'landing_page_link': '',
	'repository_link_primary': '',
	'additional_repository_links': [],
	'communication_channel': '',
	'video_submissions': {},
	'beta_testing': {},
	'ratings': {}
};

//-+Group name
//-+Project name
//-+Project description
//-+Group members
//-+Repo link(s)
//—+Primary repo link (where the issues are tracked)
//-[+might just use github?.. or rocket chat] How to communicate (formerly slack channel)
//-+Video links
//-+Beta testing stuff
//-+*Rating and reviews
//-[Might just be github]Landing page link
//-How to contribute (Content creation)
//-TA(s)?
//	-Documentation?
//	-Grades (not in database)
//	-Issues (Could stay in the repo. Maybe mark certain status like unassigned bounty task)


exports.youtube_parser = youtube_parser = function youtube_parser(url) {
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
	var match = url.match(regExp);
	return (match && match[7].length == 11) ? match[7] : false;
};

exports.create_project = create_project = function create_project(project_name, team_name, course_id, founding_member) {
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
		//'additional_repository_links': [],
		'communication_channel': '',
		'video_submissions': {},
		'beta_testing': {},
		'ratings': {}
	})
};


// dumbest thing I've ever done
var router = {
	'get': function (a, b, c) {
	}, 'post': function (a, b, c) {
	}
};


function get_project(req, res, course_id, team_id, next) {
	return db.get('projects').findOne({
		'course': course_id,
		'team_id': team_id
	}, {}, function (err, project) {
		if (err) {
			req.flash('error', 'Invalid project ID');
			res.redirect('/courses/' + course_id + '/projects');
		} else if (!project) {
			req.flash('error', 'Invalid project ID');
			res.redirect('/courses/' + course_id + '/projects');
		} else {
			res.to_template.project = project;
			next(project);
		}
	});
}

exports.project_page = function project_page(req, res, course) {
	get_project(req, res, course.course, req.params.project, function (this_project) {
		res.render('projects/single_project', res.to_template);
	});
};


exports.update_project = function update_project(req, res, course) {
	get_project(req, res, course.course, req.params.project, function (this_project) {
		// TODO: populate text fields in view with current settings (currently getting settings list from course)
		res.render('projects/project_options', res.to_template);
	});
};

router.post('/:course/update-project-options/:project', function (req, res) {
	// TODO
});

//router.get('/:course/update-project-options/:project', function (req, res) {
//	var db = req.db;
//	var collection = db.get('course_content');
//	var course = req.params.course;
//	collection.findOne({'course': course}, {}, function (err, record) {
//		if (err) {
//			console.log(err);
//			res.render('error');
//		} else if (!record) {
//			console.log('course not found');
//		} else {
//			res.to_template.course = record;
//			db.get('projects').findOne({
//				'course': req.params.course,
//				'team_id': req.params.project
//			}, {}, function (err, this_project) {
//				if (err) {
//					//
//				} else if (!this_project) {
//					req.flash('error', 'Invalid project ID');
//					res.redirect('/courses/' + req.params.course + '/projects');
//				} else {
//					res.to_template.project = this_project;
//					res.render('projects/project_options', res.to_template);
//				}
//			});
//		}
//	});
//});


function rate_project(project, rater, rating) {
	// Check if rater has rated this project before
	// add rating if they haven't
}

exports.projects_page = function projects_page(req, res, course) {
	//var db = req.db;
	//var collection = db.get('course_content');
	//var course = req.params.course;
	//collection.findOne({'course': course}, {}, function (err, record) {
	//	if (err) {
	//		console.log(err);
	//		res.render('error');
	//	} else if (!record) {
	//		console.log('course not found');
	//	} else
	if (course.project && course.project === 'old') {
		//res.to_template.course = course;
		res.to_template.projects = course.projects;
		res.render('projects/projects_archived', res.to_template);
	} else {
		if (res.to_template.user && res.to_template.user.courses_enrolled[course]) {
			res.to_template.user.course_options = res.to_template.user.courses_enrolled[course].options;
		}
		//res.to_template.course = course;
		var projects_collection = db.get('projects');
		projects_collection.find({'course': course.course}, {sort: {team_id: 1}}, function (err, all_projects) {
			res.to_template.projects = all_projects;
			console.log(all_projects);
			res.render('projects/projects', res.to_template);
		});
	}
	//});
};

//router.get('/:course/create-project', function (req, res) {
//	var db = req.db;
//	var collection = db.get('course_content');
//	var course = req.params.course;
//	collection.findOne({'course': course}, {}, function (err, record) {
//		if (err) {
//			console.log(err);
//			res.render('error');
//		} else if (!record) {
//			console.log('course not found');
//		} else {
//			res.to_template.course = record;
//

exports.get_create_project = function get_create_project(req, res, course) {
	if (res.to_template.user && res.to_template.user.courses_enrolled[course.course]) {
		res.render('projects/create_project', res.to_template);
	} else {
		req.flash('error', 'You are not enrolled in this course');
		res.redirect('/courses/' + course.course + '/projects');
	}
};

exports.post_create_project = function post_create_project(req, res, course) {
	//var db = req.db;
	//var collection = db.get('course_content');
	//var course = req.params.course;
	//	collection.findOne({'course': course}, {}, function (err, record) {
	//		if (err) {
	//			console.log(err);
	//			res.render('error');
	//		} else if (!record) {
	//			console.log('course not found');
	//		} else {
	//			res.to_template.course = record;


	if (req.body.project_name && req.body.team_name) {
		if (res.to_template.user && res.to_template.user.courses_enrolled[course.course]) {
			create_project(req.body.project_name, req.body.team_name, course.course, res.to_template.user.username);

			var team_id = req.body.team_name.toLowerCase().trim().replace(/\s+/g, '-');
			var set_string = 'courses_enrolled.' + course.course + '.options.team_id.value';
			var to_set = {$set: {}};
			to_set.$set[set_string] = team_id;

			db.get('users').update({'username': req.user.username}, to_set);

			req.flash('success', req.body.project_name + ' by ' + req.body.team_name + ' has been created');
			res.redirect('/courses/' + course.course + '/projects');
		} else {
			req.flash('error', 'You are not enrolled in this course');
			res.redirect('/courses/' + course.course + '/projects');
		}
	}
	//	});
	//}

};


exports.submit_video = function submit_video(req, res, course) {
	//var db = req.db;
	//var collection = db.get('course_content');
	//var course = req.params.course;
	//collection.findOne({'course': course}, {}, function (err, record) {
	//	if (err) {
	//		console.log(err);
	//		res.render('error finding course');
	//	} else if (!record) {
	//		console.log('course not found');
	//	} else {

	if (req.body.link) {
		//res.to_template.course = record;
		if (res.to_template.user && res.to_template.user.courses_enrolled[course.course]) {

			var user_team = res.to_template.user.courses_enrolled[course.course].options.team_id.value;

			console.log('hey');
			console.log(user_team);
			//console.log(user_team);
			//var projects_collection = db.get('projects');
			//projects_collection.findOne({
			//	'course': course,
			//	'team_id': user_team
			//}, function (err, this_project) {
			//	if (err) {
			//		console.log('error finding project');
			//		console.log(err);
			//		//
			//	} else if (!this_project) {
			//		console.log('no project');
			//		console.log(JSON.stringify(res.to_template.user, null, 4));
			//		//
			//	} else {
			//		console.log(this_project);
			get_project(req, res, course.course, user_team, function (this_project) {
				// TODO: populate text fields in view with current settings (currently getting settings list from course)
				//	res.render('projects/project_options', res.to_template);
				//});
				var set_string = 'video_submissions.' + req.params.submission;
				var to_set = {$set: {}};
				to_set.$set[set_string] = {
					'link': youtube_parser(req.body.link),
					'occasion': req.params.submission
				};

				//.
				//	link = youtube_parser(req.body.link);
				//	to_set.$set[set_string].occasion = req.params.submission;

				db.get('projects').update({
					'course': course.course,
					'team_id': user_team
				}, to_set, function (err) {
					req.flash('success', 'Submitted ' + req.body.link + ' for ' + this_project.team_name);
					res.redirect('/courses/' + course.course + '/project/' + user_team);
				});
			});
		} else {
			req.flash('error', 'You are not enrolled in this course');
			res.redirect('/courses/' + course.course + '/syllabus');
		}
	} else {
		req.flash('error', 'No link found');
		res.redirect('/courses/' + course.course + '/syllabus');
	}

//		}
//		);
//}
};


exports.join_team = function join_team(req, res, course) {
	// TODO: Remove user from previous group (It's redundant for a project to track members. Maybe just remove this?)
	//req.db.get('course_content').findOne({'course': req.params.course}, {}, function (err, record) {
	//	if (err) {
	//		console.log(err);
	//		res.render('error');
	//	} else if (!record) {
	//		// TODO: course not found
	//	} else {
	//		res.to_template.course = record;

	if (res.to_template.user && res.to_template.user.courses_enrolled[req.params.course]) {
		var set_string = 'courses_enrolled.' + req.params.course + '.options.team_id.value';
		var to_set = {$set: {}};
		to_set.$set[set_string] = req.params.team_id;

		req.db.get('users').update({'username': res.to_template.user.username}, to_set);
		req.flash('success', 'You joined ' + req.params.team_id); // TODO: make sure this is true
	} else {
		req.flash('error', 'Not enrolled in this course');
	}
	res.redirect('/courses/' + req.params.course + '/project/' + req.params.team_id);

	//}
	//});
};
// end project routes


