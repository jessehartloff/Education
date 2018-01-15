var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var users = require('../util/users');
var collection_ps = db.get('ps');

var current_course = 'cse115-s18';

var collection_entry_example =
{
	'username': 'hartloff',
	'lab_section':'B3',
	'id': 1232313123,
	'section_id': 123455,
	'ps_latest': {},
	'latest_ps_submitted':false,
	'ps_submitted': [],
	'levels': {},
	'xp': {},
	'lab_stuff': "? we'll get there. Worst case, manually checked/verified. Maybe only checked on card swipe.."
};

var ps_example =
{
	'assigned_username':'hartloff',
	'ps_number':4,
	'concept': 'algos2',
	'submitted': true,
	'questions': [
		{'type': 4, 'variant': 521, 'correct': true, "feedback": "good job"},
		{'type': 2, 'variant': 19, 'correct': true, "feedback": "good job"},
		{'type': 1, 'variant': 823, 'correct': true, "feedback": "good job"},
		{'type': 5, 'variant': 79, 'correct': true, "feedback": "good job"},
		{'type': 3, 'variant': 372, 'correct': true, "feedback": "good job"}
	]
};

var question_example =
{
	"concept": "algos1",
	"type": 2,
	"variant": 42,
	"instruction_text": "Write a method that takes an ArrayList of Integers as its only parameter and outputs the " +
	"average of all the values as a double",
	"cards": []
};


var card_example = "Link to lecture content and videos";


//var PS =
//	"public class ProblemSet_hartloff_1{
//
//
///**
// * Instructions
// */
//public static void Q1(){
//
//}
//
///**
// * Instructions
// */
//public static void Q2(){
//
//}
//
///**
// * Instructions
// */
//public static void Q3(){
//
//}
//
///**
// * Instructions
// */
//public static void Q4(){
//
//}
//
///**
// * Instructions
// */
//public static void Q5(){
//
//}
//
//
//public static void main(String[] args){
//
//	/* Test your code here before submitting */
//
//}
//
//}
//";

// API:
// Get current PS by section_id
// Send PS results and feedback by section_id

exports.get_ps = function get_ps(req, res, course) {
	//var user_enrolled = users.user_enrolled(req);
	//if (user_enrolled || true) {
	//	collection_questions.find({"username": req.user.username}, {}, function (err, user_questions) {
	//		if (err) {
	//			console.log(err);
	//			req.flash("error", "Database error 1");
	//			res.redirect('/courses/' + course.course + '/questions');
	//		} else {
	//			res.to_template.question = generate_new_question(req.user.username, user_questions);
	//			res.render('questions/question', res.to_template);
	//		}
	//	});
	//
	//} else {
	//	req.flash('error', 'You are not enrolled in this course. Login and click the enroll button in the upper right corner of the site to enroll');
	//	res.redirect('/courses/' + course.course + '/questions');
	//}

	res.render('questions/ps', res.to_template);
};


//exports.post_ps = function post_ps(req, res, course) {
//	var user_enrolled = users.user_enrolled(req);
//	//user_enrolled = true; // DEV LINE
//	if (user_enrolled) {
//		var question_id = req.body.question_id;
//		var answer = req.body.answer;
//
//		grade_that_shit(req, res, course, req.user.username, question_id, answer, function (req, res) {
//			collection_questions.find({"username": req.user.username}, {}, function (err, user_questions) {
//				if (err) {
//					console.log(err);
//					req.flash("error", "Database error 1");
//					res.redirect('/courses/' + course.course + '/questions');
//				} else {
//					console.log("hey");
//					res.to_template.question = generate_new_question(req.user.username, user_questions);
//					res.render('questions/question', res.to_template);
//				}
//			});
//		});
//	} else {
//		req.flash('error', 'You are not enrolled in this course. Login and click the enroll button in the upper right corner of the site to enroll');
//		res.redirect('/courses/' + course.course + '/questions');
//	}
//};
