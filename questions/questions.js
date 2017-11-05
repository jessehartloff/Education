var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var users = require('../util/users');
var collection_questions = db.get('questions');

var addition = require('./question_templates/addition');
var multiplication = require('./question_templates/multiplication');
var algebra1 = require('./question_templates/algebra1');


function determine_next_question_params(username, user_questions) {
	var max_addition = 0.0;
	var max_multiplication = 0.0;
	var max_algebra1 = 0.0;

	for (var i in user_questions) {
		var question = user_questions[i];
		if (question.correct) {
			if (question.template === "addition" && question.difficulty > max_addition) {
				max_addition = question.difficulty;
			}
			else if (question.template === "multiplication" && question.difficulty > max_multiplication) {
				max_multiplication = question.difficulty;
			}
			else if (question.template === "algebra1" && question.difficulty > max_algebra1) {
				max_algebra1 = question.difficulty;
			}
		}
	}

	var template = "addition";
	var increase = Math.random() / 10.0;
	var difficulty = max_addition + increase;

	if (max_addition >= 1.0) {
		if (max_multiplication >= 1.0) {
			template = "algebra1";
			difficulty = max_algebra1 + increase;
		} else {
			template = "multiplication";
			difficulty = max_multiplication + increase;
		}
	}

	difficulty = Math.min(1.0, difficulty);
	difficulty = Math.max(0.0, difficulty);

	console.log("new difficulty: " + difficulty);
	return {"template": template, "difficulty": difficulty};
}


function generate_new_question(username, user_questions) {
	var question_params = determine_next_question_params(username, user_questions);
	var question = get_template(question_params.template).generate_question(question_params);
	var question_id = new_question_id();
	var toStore = Object.assign({}, question_params, question, {
		"username": username,
		"question_id": question_id
	});
	collection_questions.insert(toStore);
	return {"question_id": question_id, "question_text": question.question_text};
}


function grade_that_shit(req, res, course, username, question_id, student_answer, next) {

	collection_questions.findOne({"question_id": question_id, "username": username}, {}, function (err, question) {
		if (err) {
			req.flash("error", "Database error");
			res.redirect('/courses/' + course.course + '/questions');
		} else if (!question) {
			req.flash("error", "Question not found");
			res.redirect('/courses/' + course.course + '/questions');
		} else {
			var template = get_template(question.template);
			var feedback = template.grade_question(question.grader_params, student_answer);
			res.to_template.feedback = feedback;
			collection_questions.update({
				"question_id": question.question_id
				//"username": username // overkill
			}, {
				$set: {
					"correct": feedback.correct,
					"feedback": feedback.text,
					"student_answer": student_answer
				}
			}, function (err) {
				if (err) {
					req.flash("error", "Database error");
					res.redirect('/courses/' + course.course + '/questions');
				} else {
					next(req, res);
				}
			});
		}
	});

}

function get_template(template_name) {
	switch (template_name) {
		case "addition":
			return addition;
		case "multiplication":
			return multiplication;
		case "algebra1":
			return algebra1;
		default:
			console.log("invalid template name. Using addition");
			return "addition";
	}
}

exports.get_question = function get_question(req, res, course) {
	var user_enrolled = users.user_enrolled(req);
	if (user_enrolled || true) {
		collection_questions.find({"username": req.user.username}, {}, function (err, user_questions) {
			if (err) {
				console.log(err);
				req.flash("error", "Database error 1");
				res.redirect('/courses/' + course.course + '/questions');
			} else {
				res.to_template.question = generate_new_question(req.user.username, user_questions);
				res.render('questions/question', res.to_template);
			}
		});

	} else {
		req.flash('error', 'You are not enrolled in this course. Login and click the enroll button in the upper right corner of the site to enroll');
		res.redirect('/courses/' + course.course + '/questions');
	}
};


exports.post_question = function post_question(req, res, course) {
	var user_enrolled = users.user_enrolled(req);
	//user_enrolled = true; // DEV LINE
	if (user_enrolled) {
		var question_id = req.body.question_id;
		var answer = req.body.answer;

		grade_that_shit(req, res, course, req.user.username, question_id, answer, function (req, res) {
			collection_questions.find({"username": req.user.username}, {}, function (err, user_questions) {
				if (err) {
					console.log(err);
					req.flash("error", "Database error 1");
					res.redirect('/courses/' + course.course + '/questions');
				} else {
					console.log("hey");
					res.to_template.question = generate_new_question(req.user.username, user_questions);
					res.render('questions/question', res.to_template);
				}
			});
		});
	} else {
		req.flash('error', 'You are not enrolled in this course. Login and click the enroll button in the upper right corner of the site to enroll');
		res.redirect('/courses/' + course.course + '/questions');
	}
};


function new_question_id() {
	var length = 16;
	var alphabet = '0123456789';
	var token = '';
	for (var i = 0; i < length; i++) {
		token += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	return token;
}
