var express = require('express');
var router = express.Router();
var users_util = require('../util/users');
var course_util = require('../util/course');
var projects_util = require('../util/projects');
var api_util = require('../util/api');


// TODO: Log everything! Especially from the web hook. I want to pull everything that a particular student has done (push to develop? No code review? No PR? No commits to a feature branch?)

// TODO: Show videos with corresponding release on single project page. Finish formatting the single project page

// TODO: Bugfix. No enroll button

// TODO: Office hours App
// TODO: Meeting scheduling
// TODO: Ratings and reviews. I should be able to set a rubric for each sprint and they fill out the rubric. Maybe.. all results shown to the team, only overall is shown publicly
// TODO: Ratings are hidden until the end of a round (or hidden forever). Reviews can be displayed
// ~TODO: Public reviews? At least private messages to the team (email lists? Ryver? Github? my site?)
// Ambitious: Chat on each project page. Team mates messages display differently

// ~TODO: Students can join groups and edit their group's content
// ~TODO: User roles and different views for Student/TA/Instructor (For office hours)

// TODO: Message system at the top (flash) for course messages (ie. next deadline, warning that you haven't submitted)

// TODO: Add student videos (advice to future students) to resources

// ~TODO: Q&A tied to lecture sections

// ~TODO: Change deadline on a per lab basis (Autolab)


router.get('/', function (req, res) {
	res.render('index', res.to_template);
});


router.get('/:course/lectures/:lecture', function (req, res) {
	course_util.render_content(req, res, 'lectures', req.params.lecture);
});

router.get('/:course/assignments/:assignment', function (req, res) {
	course_util.render_content(req, res, 'assignments', req.params.assignment);
});

router.get('/:course/enroll', function (req, res) {
	if (res.to_template.user) {
		users_util.enroll(res.to_template.user.username, req.params.course);
		req.flash('success', 'Enrolled in ' + req.params.course);
		res.redirect('/courses/' + req.params.course + '/syllabus');
	} else {
		req.flash('error', 'not logged in');
		res.redirect('/courses/' + req.params.course + '/syllabus');
	}
});


router.get('/:course/deeper-dive/:concept/:topic', function (req, res) {
	api_util.deeper_dive(req, res);
});

router.get('/:course/reference/:lecture/:section', function (req, res) {
	api_util.reference(req, res);
});


// Project routes
router.get('/:course/project/:project', function (req, res) {
	course_util.preprocess_course(req, res, projects_util.project_page);
});

router.get('/:course/update-project/:project', function (req, res) {
	course_util.preprocess_course(req, res, projects_util.update_project_get);
});

router.post('/:course/update-project/:project', function (req, res) {
	course_util.preprocess_course(req, res, projects_util.update_project_post);
});

router.get('/:course/projects', function (req, res) {
	course_util.preprocess_course(req, res, projects_util.projects_page);
});

router.get('/:course/create-project', function (req, res) {
	course_util.preprocess_course(req, res, projects_util.get_create_project);
});

router.post('/:course/create-project', function (req, res) {
	course_util.preprocess_course(req, res, projects_util.post_create_project);
});

router.post('/:course/submit-video/:submission', function (req, res) {
	course_util.preprocess_course(req, res, projects_util.submit_video);
});


router.post('/:course/join-team/:team_id', function (req, res) {
	course_util.preprocess_course(req, res, projects_util.join_team);
});
// end project routes


router.get('/:course/:extra', function (req, res) {
	course_util.render_content(req, res, 'extra', req.params.extra);
});

router.get('/:course/*', function (req, res) {
	course_util.render_content(req, res, 'extra', 'syllabus');
});

module.exports = router;