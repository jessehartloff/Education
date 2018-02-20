var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var users = require('./users');


exports.youtube_parser = youtube_parser = function youtube_parser(url) {
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
	var match = url.match(regExp);
	return (match && match[7].length == 11) ? match[7] : false;
};


function team_name_to_id(team_name) {
	var team_id = team_name.toLowerCase().trim().replace(/\s+/g, '_').replace(/\W/g, '').replace(/_/g, '-');
	if (team_id.length < 2) {
		team_id += "-" + random_id(5);
	}
	return team_id;
}


function random_id(token_length) {
	var length = token_length || 5;
	var alphabet = '0123456789';
	var token = '';
	for (var i = 0; i < length; i++) {
		token += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	return token;
}


//function random_id34e(token_length) {
//	var length = token_length || 8;
//	var alphabet = '0123456789QWERTYUIOPLKJHGFDSAZXCVBNM';
//	var token = '';
//	for (var i = 0; i < length; i++) {
//		token += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
//	}
//	console.log(token);
//	return token;
//}
//
//random_id34e();
//random_id34e();
//random_id34e();
//random_id34e();

exports.create_project = create_project = function create_project(project_name, team_name, course_id, founding_member) {
	// Convert project name to url param (remove all non-safe chars, toLower, dashes for spaces) [check for name conflicts]
	var projects_collection = db.get('projects');
	var team_id = team_name_to_id(team_name);
	db.get('projects').findOne({
		'course': course_id,
		'team_id': team_id
	}, {}, function (err, project) {
		if (project) {
			team_id += "-" + random_id(5);
		}
		projects_collection.insert({
			'team_id': team_id,
			'course': course_id,
			'team_name': team_name,
			'founder': founding_member,
			'member2': '',
			'member3': '',
			'member4': '',
			'member5': '',
			//'members': [founding_member],
			'project_name': project_name,
			'project_description': '',
			'landing_page_link': '',
			'repository_link_primary': '',
			'communication_channel': '',
			'video_submissions': {},
			'ratings': {}
		})
	});
};


function get_project(req, res, course_id, team_id, next) {
	return db.get('projects').findOne({
		'course': course_id,
		'team_id': team_id
	}, {}, function (err, project) {
		if (err) {
			req.flash('error', 'Invalid project ID ' + err);
			console.log(err);
			res.redirect('/courses/' + course_id + '/projects');
		} else if (!project) {
			req.flash('error', 'Invalid project ID');
			res.redirect('/courses/' + course_id + '/projects');
		} else {
			res.to_template.project = project;
			if (users.user_enrolled(req) && req.user.courses_enrolled[course_id].options.team_id &&
				req.user.courses_enrolled[course_id].options.team_id.value == team_id) {
				res.to_template.user.on_this_team = true;
				if (project.founder && project.founder === req.user.username) {
					res.to_template.user.team_founder = true;
				}
			}
			//console.log(JSON.stringify(project, null, 4));
			next(req, res, project);
		}
	});
}

function get_members(req, res, course_id, this_project, next) {
	var find_me = {};
	find_me['courses_enrolled.' + course_id + '.options.team_id.value'] = this_project.team_id;
	db.get('users').find(find_me, {_id: 0, password: 0}, function (err, members) {
		if (err) {
			req.flash('error', 'Error finding team members - ' + err);
			res.redirect('/courses/' + course_id + '/projects');
		} else {

			//console.log('first');
			//console.log(members);
			var members_simple = [];
			for (var i in members) {
				members_simple.push(members[i].username);
				members[i].options = members[i].courses_enrolled[course_id].options;
			}

			// I hate this..
			var team_members = [];
			if (this_project.founder) {
				team_members.push(this_project.founder);
			}
			if (this_project.member2) {
				team_members.push(this_project.member2);
			}
			if (this_project.member3) {
				team_members.push(this_project.member3);
			}
			if (this_project.member4) {
				team_members.push(this_project.member4);
			}
			if (this_project.member5) {
				team_members.push(this_project.member5);
			}

			//if (users.user_enrolled(req)) {
			//	for (var i in members_simple) {
			//		if (team_members.indexOf(members_simple[i]) == -1) {
			//			req.flash('error', members_simple[i] + ' is not listed properly! They must find a new team or be added to this one')
			//		}
			//	}
			//
			//	for (var i in team_members) {
			//		if (members_simple.indexOf(team_members[i]) == -1) {
			//			req.flash('error', team_members[i] + ' is not listed properly! They are not a member of this team')
			//		}
			//	}
			//}
			//console.log(members_simple);
			//console.log(team_members);

			res.to_template.members = members;
			next();
		}
	});
}

exports.project_page = function project_page(req, res, course) {
	get_project(req, res, course.course, req.params.project, function (req, res, this_project) {
		get_members(req, res, course.course, this_project, function () {
			res.render('projects/single_project', res.to_template);
		});
	});
};


exports.update_project_get = function update_project_get(req, res, course) {
	get_project(req, res, course.course, req.params.project, function (req, res, this_project) {
		if (res.to_template.user.team_founder) {
			res.render('projects/edit_project', res.to_template);
		} else {
			req.flash('error', 'Only the team founder can edit the project');
			res.render('projects/single_project', res.to_template);
		}
	});
};

exports.update_project_post = function update_project_post(req, res, course) {
	get_project(req, res, course.course, req.params.project, function (req, res, this_project) {
		if (res.to_template.user.team_founder) {

			//console.log(req.body.team_name);
			//console.log(req.body.project_name);
			//console.log(req.body.project_description);
			//console.log(req.body.repository_link_primary);
			//console.log(req.body.communication_channel);
			//console.log(req.body.landing_page_link);
			//console.log(req.body.member2);
			//console.log(req.body.member3);
			//console.log(req.body.member4);
			//console.log(req.body.member5);


			// Updating members does not remove them from their current team. Students need to be responsible..
			var new_values = {
				'team_name': req.body.team_name,
				'project_name': req.body.project_name,
				'project_description': req.body.project_description,
				'project_description_short': truncate_description(req.body.project_description),
				'repository_link_primary': req.body.repository_link_primary,
				'communication_channel': req.body.communication_channel,
				'landing_page_link': req.body.landing_page_link,
				'member2': req.body.member2,
				'member3': req.body.member3,
				'member4': req.body.member4,
				'member5': req.body.member5
			};


			var to_set = {$set: new_values};

			// Currently does not need acceptance from members
			set_user_team(course.course, this_project.team_id, req.body.member2);
			set_user_team(course.course, this_project.team_id, req.body.member3);
			set_user_team(course.course, this_project.team_id, req.body.member4);
			set_user_team(course.course, this_project.team_id, req.body.member5);


			db.get('projects').update({
				'course': course.course,
				'team_id': this_project.team_id
			}, to_set, function (err) {
				if (err) {
					req.flash('error', 'Error updating project');
				} else {
					req.flash('success', 'Updated ' + this_project.team_name);
				}
				res.redirect('/courses/' + course.course + '/project/' + this_project.team_id);
			});

		} else {
			req.flash('error', 'Only the team founder can edit the project');
			res.redirect('/courses/' + course.course + '/project/' + this_project.team_id);
		}
	});

};

function truncate_description(description) {
	var description_cutoff = 200;
	if (description.length > description_cutoff) {
		return description.substring(0, description_cutoff) + '...';
	} else {
		return description;
	}
}

function rate_project(project, rater, rating) {
	// TODO
	// Check if rater has rated this project before
	// add rating if they haven't
	// or rate each release
	// or rate all the time for any reason, or when I or the team create an new event
}

exports.projects_page = function projects_page(req, res, course) {
	if (course.project && course.project === 'old') {
		res.to_template.projects = course.projects;
		res.render('projects/projects_archived', res.to_template);
	} else if (course.course_options.has_project_new) {
		var projects_collection = db.get('projects');
		projects_collection.find({'course': course.course}, {sort: {_id: 1}}, function (err, all_projects) {
			res.to_template.projects = all_projects;
			res.render('projects/projects_new', res.to_template);
		});
	} else {
		if (users.user_enrolled(req)) {
			res.to_template.user.course_options = res.to_template.user.courses_enrolled[course.course].options;
		}
		var projects_collection = db.get('projects');
		projects_collection.find({'course': course.course}, {sort: {team_id: 1}}, function (err, all_projects) {
			res.to_template.projects = all_projects;
			res.render('projects/projects', res.to_template);
		});
	}
};


exports.get_create_project = function get_create_project(req, res, course) {
	if (users.user_enrolled(req)) {
		res.render('projects/create_project', res.to_template);
	} else {
		req.flash('error', 'You are not enrolled in this course. Login and click the enroll button in the upper right corner of the site to enroll');
		res.redirect('/courses/' + course.course + '/projects');
	}
};

exports.post_create_project = function post_create_project(req, res, course) {
	if (req.body.project_name && req.body.team_name) {
		if (users.user_enrolled(req)) {
			create_project(req.body.project_name, req.body.team_name, course.course, res.to_template.user.username);

			var team_id = team_name_to_id(req.body.team_name);
			set_user_team(course.course, team_id, req.user.username);

			req.flash('success', req.body.project_name + ' by ' + req.body.team_name + ' has been created');
			res.redirect('/courses/' + course.course + '/projects');
		} else {
			req.flash('error', 'You are not enrolled in this course. Login and click the enroll button in the upper right corner of the site to enroll');
			res.redirect('/courses/' + course.course + '/projects');
		}
	}
};


exports.submit_video = function submit_video(req, res, course) {
	if (req.body.link) {
		if (users.user_enrolled(req)) {
			var user_team = res.to_template.user.courses_enrolled[course.course].options.team_id.value;
			get_project(req, res, course.course, user_team, function (req, res, this_project) {
				var set_string = 'video_submissions.' + req.params.submission;
				var to_set = {$set: {}};
				to_set.$set[set_string] = {
					'link': youtube_parser(req.body.link),
					'occasion': req.params.submission
				};

				db.get('projects').update({
					'course': course.course,
					'team_id': user_team
				}, to_set, function (err) {
					if (err) {
						req.flash('error', 'Error uploading video');
					} else {
						req.flash('success', 'Submitted ' + req.body.link + ' for ' + this_project.team_name);
					}
					res.redirect('/courses/' + course.course + '/project/' + user_team);
				});
			});
		} else {
			req.flash('error', 'You are not enrolled in this course. Login and click the enroll button in the upper right corner of the site to enroll');
			res.redirect('/courses/' + course.course + '/syllabus');
		}
	} else {
		req.flash('error', 'No link found');
		res.redirect('/courses/' + course.course + '/syllabus');
	}
};


function set_user_team(course_id, team_id, user_id) {
	//if (res.to_template.user && res.to_template.user.courses_enrolled[req.params.course]) {
	var set_string = 'courses_enrolled.' + course_id + '.options.team_id.value';
	var to_set = {$set: {}};
	to_set.$set[set_string] = team_id;

	db.get('users').update({'username': user_id}, to_set);
	//}
}


