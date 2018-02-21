var express = require('express');
var router = express.Router();
var users_util = require('../util/users');
var course_util = require('../util/course');
var projects_util = require('../util/projects');
var api_util = require('../util/api');
var questions_util = require('../questions/questions');
var ps_util = require('../quests/problemSets');
var lab_util = require('../quests/lab');
var hw_util = require('../quests/projects');


// TODO: Log everything! Especially from the web hook. I want to pull everything that a particular student has done (push to develop? No code review? No PR? No commits to a feature branch?)

// TOD/: They must list what they will learn from the project (new skills/tech) In the team contract for each member

// ~TODO: Office hours App
// ~TODO: Meeting scheduling

// ~Ambitious: Chat on each project page. Team mates messages display differently

// ~TODO: Message system at the top (flash) for course messages (ie. next deadline, warning that you haven't submitted)

// ~TODO: Q&A tied to lecture sections
// ~TODO: User roles and different views for Student/TA/Instructor (For office hours)


router.get('/', function (req, res) {
	res.render('index', res.to_template);
});


router.get('/:course/lectures/:lecture', function (req, res) {
	course_util.render_content(req, res, 'lectures', req.params.lecture);
});


router.get('/:course/assignments/ps', function (req, res) {
	course_util.preprocess_course(req, res, ps_util.get_ps);
});

router.get('/:course/assignments/lab', function (req, res) {
	course_util.preprocess_course(req, res, lab_util.get_lab);
});

router.get('/:course/assignments/hw', function (req, res) {
	course_util.preprocess_course(req, res, hw_util.get_hw);
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


// Questions
router.get('/:course/questions', function (req, res) {
	course_util.preprocess_course(req, res, questions_util.get_question);
});

router.post('/:course/questions', function (req, res) {
	course_util.preprocess_course(req, res, questions_util.post_question);
});


// Problem Sets
router.get('/:course/ps', function (req, res) {
	course_util.preprocess_course(req, res, ps_util.get_ps);
});

router.get('/:course/ps-download', function (req, res) {
	course_util.preprocess_course(req, res, ps_util.ps_download);
});

//router.get('/:course/ps-download-new', function (req, res) {
//	course_util.preprocess_course(req, res, ps_util.ps_download_new);
//});
//
//router.get('/:course/ps-download-current', function (req, res) {
//	course_util.preprocess_course(req, res, ps_util.ps_download_current);
//});

router.post('/:course/ps-api', function (req, res) {
	course_util.preprocess_course(req, res, ps_util.ps_api);
});
// end Problem Sets




// Labs
router.get('/:course/lab', function (req, res) {
	course_util.preprocess_course(req, res, lab_util.get_lab);
});

router.post('/:course/lab-check-in', function (req, res) {
	course_util.preprocess_course(req, res, lab_util.lab_check_in);
});

router.get('/:course/active-lab/:lab_number', function (req, res) {
	course_util.preprocess_course(req, res, lab_util.start_lab);
});

router.post('/:course/active-lab/:lab_number', function (req, res) {
	course_util.preprocess_course(req, res, lab_util.answer_lab_question);
});

//router.get('/:course/lab-checkout', function (req, res) {
//	course_util.preprocess_course(req, res, lab_util.lab_checkout);
//});

//router.get('/:course/ps-download-new', function (req, res) {
//	course_util.preprocess_course(req, res, ps_util.ps_download_new);
//});
//
//router.get('/:course/ps-download-current', function (req, res) {
//	course_util.preprocess_course(req, res, ps_util.ps_download_current);
//});

router.post('/:course/lab-api', function (req, res) {
	course_util.preprocess_course(req, res, lab_util.lab_api);
});
// end Labs



router.get('/:course/:extra', function (req, res) {
	course_util.render_content(req, res, 'extra', req.params.extra);
});

router.get('/:course/*', function (req, res) {
	course_util.render_content(req, res, 'extra', 'syllabus');
});

module.exports = router;