var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
//var level_requirements = require('./level_requirements/requirements');

var collection_ps = db.get('ps');


// TODO: Labs. Get lab after it's been activated which I do manually at the end of the friday lecture
// TODO: They can only access the lab after swiping into lab. Before this, the lab shows, but is greyed out
// TODO: Each lab has a level recommendation and a warning/confirmation if they check out a lab for which they are under leveled

var example =
{
	username: "hartloff",

	lab_validation: false, // true after sign-in and before lab ends
	valid_until: 5,
	all_validations: [], // {ta:"", timestamp:5}

	current_lab_attempt:{}, // easy access for API
	labs: {"lab1":{}, "lab2": {}, "lab3":{}}

};

var lab_example =
{
	complete: false,
	prelab_complete: false,
	prelab_questions_required:5,
	prelab_questions_completed:2,
	all_attempts:[]
};

var lab_attempt_example =
{
	lab_number:1,
	type: 2,
	variant: 5,
	phases:[], // {phase_name:"part1", questions_required:5, questions_completed:2} ...
	phases_satisfied:false,
	autolab_satisfied : false

};

var question_example =
{
	lab_number:1,
	type: 2,
	variant: 5,
	question_text: "What's the output on this input?",
	grader_type: "", // int, String, double, substring, substring_max_length
	parameters:{}, // for grading
	expected: "" // obviously don't send this
};

//var answer_example =
//{
//
//};

function question_grader(question, answer){
	// get known answer for question from database
	// answer is the String from the student text box
	// based on question type attempt to convert the text to the appropriate type, then run the grader for that type
}

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



// API
// Checkout Lab (Generate type/variant) (cap at 2/session)
// Get next input/question based on type/variant
// Submit answer to current input (and get next input/question) (check if phase satisfied, move to next phase)
// Autolab says you've completed it's part (mark AutoLab satisfied)

exports.lab_api = function lab_api(req, res, course) {
	//console.log("API: " + req.body);
	if (req.body.key !== "super_secret_key") {
		res.send("You can't use this API");
		log.error("VIOLATION: Bad access to lab API" + req.body)
	} else if (!req.headers['user-agent']) {
		res.send("You can't use this API");
		log.error("VIOLATION: Bad user-agent to lab API" + req.body)
	} else if (req.body.request_type === "get_current_lab") {
		api_get_current_ps(req, res, course);
	} else if (req.body.request_type === "send_lab_results") {
		api_send_ps_results(req, res, course);
	} else if (req.body.request_type === "violation") {
		api_record_violation(req, res, course);
	} else {
		res.send("bad request type: " + req.body.request_type);
		log.warn("Lab API bad request type: " + req.body.request_type);
	}
};

function api_record_violation(req, res, course) {
	log.error("VIOLATION DETECTED" + req.body);
	res.send("Violation");
}

function api_get_current_lab(req, res, course) {
	var section_id = req.body.section_id;

	collection_ps.findOne({"section_id": section_id}, {}, function (err, record) {
		if (err) {
			console.log("database error in api_get_current_lab: " + err);
			log.error("error in api_get_current_lab");
			res.send("database error");
		} else if (!record) {
			res.send("No user found with section_id " + section_id);
		} else {
			res.send(JSON.stringify(record.current_ps))
		}
	});
}

function api_send_lab_results(req, res, course) {
	var section_id = req.body.section_id;
	var results = req.body.results;


	collection_ps.findOne({"section_id": section_id}, {}, function (err, record) {
		if (err) {
			console.log("database error in api_send_ps_results: " + err);
			log.error(section_id + "error in api_send_ps_results");
			res.send("database error");
		} else if (!record) {
			res.send("No user found with section_id " + section_id);
		} else if (record.current_ps_finished) {
			log.info(section_id + ": resubmitted ps " + record.current_ps.ps_number.toString() + " for feedback");
			console.log("Resubmission for no credit. section_id=" + section_id + " problem set=" + record.current_ps.ps_number);
			res.send("This problem set has already been submitted for credit. This submission will not count towards course progress");
		} else {

			log.info(section_id + ": submitted ps " + record.current_ps.ps_number.toString() + " for credit");
			var xp = record.xp;
			var number_correct = 0;

			for (var i = 0; i < results.length; i++) {
				var result = results[i];
				var question = record.current_ps.questions[i];
				if (!question) {
					console.log(req.user.username + ": error in api_send_lab_results. Question index " + i + " not found");
					log.error(req.user.username + ": error in api_send_lab_results. Question index " + i.toString() + " not found");
					continue;
				}
				if (result.correct) {
					if (!xp[question.concept]) {
						xp[question.concept] = {};
					}
					if (!xp[question.concept][question.type]) {
						xp[question.concept][question.type] = 0;
					}
					xp[question.concept][question.type] += 1;
					number_correct++;
				}
			}

			log.info(section_id + ": answered " + number_correct.toString() + "/" + record.current_ps.questions.length.toString() + " correct");

			if (number_correct === record.current_ps.questions.length) {
				log.info(section_id + ": all correct bonus on ps " + record.current_ps.ps_number.toString());
				record.current_ps.multipliers.push({"reason": "All questions correct!", "multiplier": 1.5});
			}

			// Tally up total xp
			var base_xp_per_question = 100.0;
			var multiplier = base_xp_per_question;
			for (var i = 0; i < record.current_ps.multipliers.length; i++) {
				multiplier *= record.current_ps.multipliers[i].multiplier;
			}

			var total_xp = record.total_xp;
			var xp_earned = number_correct * multiplier;
			if (xp_earned && xp_earned >= -1) {
				total_xp += xp_earned;
			}

			// Check for level up
			var level_up = false;
			var new_level = record.level;
			if (total_xp >= level_requirements.get_level_requirements(record.level).xp_for_next_level) {
				level_up = true;
				new_level++;
			}

			var toSet = {};
			toSet["current_ps_finished"] = true;
			toSet["all_ps_assigned." + record.current_ps.ps_number + ".xp_earned"] = xp_earned;
			toSet["all_ps_assigned." + record.current_ps.ps_number + ".multipliers"] = record.current_ps.multipliers;
			toSet["all_ps_assigned." + record.current_ps.ps_number + ".results"] = results;
			toSet["all_ps_assigned." + record.current_ps.ps_number + ".time_completed"] = Date.now();
			toSet["xp"] = xp;
			toSet["total_xp"] = total_xp;
			if (level_up) {
				toSet["level"] = new_level;
				toSet["leveled_up"] = true;
				log.info(section_id + ": leveled up to level " + new_level.toString() + "!");
			}

			collection_ps.update({"section_id": section_id}, {$set: toSet}, function (err) {
				if (err) {
					console.log("database error in api_get_current_ps update: " + err);
					res.send("database error");
					log.error(section_id + ": updating the database after grading ps in api_get_current_ps");
				} else {
					res.send("Results sent to course site");
				}
			});

		}
	});


}

// TODO: Lab swipe