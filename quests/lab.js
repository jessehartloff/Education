var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var compare = require('./comparators/comparators');
var level_requirements = require('./level_requirements/requirements');
var card_scanner = require('../util/scanner');
var log = require('winston');

var collection_ps = db.get('ps');
var collection_labs = db.get('labs'); // lab meta data
var collection_lab_versions = db.get('lab_versions'); // lab version meta data
var collection_lab_questions = db.get('lab_questions'); // get question by <lab>, <part>, and <version>;
var collection_tas = db.get('tas');


// TODO: Labs. Get lab after it's been activated which I do manually at the end of the friday lecture
// TODO: They can only access the lab after swiping into lab. Before this, the lab shows, but is greyed out
// TODO: Each lab has a level recommendation and a warning/confirmation if they check out a lab for which they are under leveled

var example =
{
	username: "hartloff",

	lab_validation: false, // true after sign-in and before lab ends
	valid_until: 5,
	all_validations: [], // {ta:"", timestamp:5}

	current_lab_attempt: {}, // easy access for API
	labs: {"lab1": {}, "lab2": {}, "lab3": {}},
	previous_lab_attempts: []

};

var lab_attempt_example =
{
	"lab_id": "lab1",
	complete: false,
	current_part: 1,
	version_number: 2,
	part_questions_completed: 2,
	part_questions_required: 5,
	all_parts_complete: false,
	autolab_complete: false,
	current_question: {}
};

var lab__example =
{
	"lab_id": "lab1",
	complete: false
};

var question_example =
{
	lab_number: 1,
	type: 2,
	variant: 5,
	question_text: "What's the output on this input?",
	grader_type: "", // int, String, double, substring, substring_max_length
	parameters: {}, // for grading
	expected: "" // obviously don't send this
};


// entry point
exports.get_lab = function get_lab(req, res, course) {

	// TODO: ** Change API key and add a level of security

	// TODO: Check if they currently have a lab checked out. If they do, check if it's expired. If it isn't, take them to that lab at their current spot
	// TODO: Show all /*available*/ labs (some are greyed out, but I only update the database as labs are ready
	// TODO: Let them choose a lab if the TA has authenticated them. Warning if they are under-leveled. Prevent checkout if they already did 2 this session

	// Once a lab attempt begins:
	// TODO: Initial instructions and back story
	// TODO: Rapid fire questions from part 1 / pre-lab
	// TODO: Lab proper instructions and back story. Let them know that they will be submitting this to AutoLab
	// TODO: Rapid fire questions from part 2
	// TODO: A note when the questions end that they still need to submit on AutoLab
	// TODO: Wait for the word from AutoLab so we know when the lab is done
	// TODO: Once lab is done go back to the main page and let them choose one more if this is their first
	// TODO: If possible, give them a different version on subsequent attempts of the same lab

	if (!req.user) {
		res.render('questions/lab', res.to_template);
	} else {
		collection_ps.findOne({"username": req.user.username}, {}, function (err, user_ps) {
			if (err) {
				console.log("database error in get_ps: " + err);
				req.flash("error", "Database error in get_lab");
				res.render('questions/lab', res.to_template);
			} else if (!user_ps) {
				console.log("user not enrolled for problem sets: " + req.user.username);
				req.flash("error", "User " + req.user.username + " is not registered for this feature. If you are enrolled in CSE115 send and email to hartloff@buffalo.edu with the subject \"CSE115 Problem Set Registration\" immediately to unlock problem sets");
				res.render('questions/lab', res.to_template);
			} else {
				//{{#each lab}}
				//{{this.lab_number}}
				//{{this.title}}
				//{{this.completed}}
				//{{this.released}}
				res.to_template.user_ps = user_ps;
				collection_labs.find({}, {}, function (err, all_labs) {

					for (var i = 0; i < all_labs.length; i++) {
						var this_lab = all_labs[i];
						var user_lab = user_ps.labs["lab" + this_lab.lab_number];
						if (user_lab) {
							all_labs[i].complete = user_lab.complete;
						} else {
							all_labs[i].complete = false;
						}
					}
					console.log(all_labs);
					res.to_template.labs = all_labs;
					res.to_template.level_name = level_requirements.get_level_requirements(user_ps.level).level_name;

					collection_tas.findOne({username: req.user.username}, {}, function (err, record) {
						res.to_template.user_is_TA = !err && record;
						// ~TODO: Always give them access
						res.render('questions/lab', res.to_template);
					});
				});


			}
		});
	}
};


exports.lab_check_in = function lab_check_in(req, res, course) {
	console.log(req.user);
	collection_tas.find({username: req.user.username}, {}, function (err, user) {
		if (err || !user) {
			req.flash("error", "You can't do that");
			log.warn(req.user.username + ": Unauthorized to check a student into lab - " + req.body.scan);
			res.redirect('/courses/' + req.params.course + '/lab');
		} else {
			if (req.body.scan) {
				var scan = req.body.scan;
				//var person = card_scanner.scan_to_person(scan);
				card_scanner.scan_to_username(scan, req, res, function (req, res, scanned_username) {
					console.log("username: " + scanned_username);
					if (!scanned_username) {
						req.flash("error", "User not found. Please rescan");
						log.warn(req.user.username + ": Failed to check a student into lab - " + req.body.scan);
						res.redirect('/courses/' + req.params.course + '/lab');
					} else {
						collection_ps.update({username: scanned_username}, {
							$set: {
								lab_validation: true,
								valid_until: Date.now() + 7200000 // active for 2 hours for now TODO: until end of lab session
							},
							$push: {
								all_validations: {"ta": req.user.username, "timestamp": Date.now()}
							}
						}, function (err, record) {
							req.flash("success", scanned_username + " checked into lab");
							log.info(scanned_username + " was checked into lab by " + req.user.username);
							res.redirect('/courses/' + req.params.course + '/lab');
						});
					}

				});
			} else {
				res.redirect('/courses/' + req.params.course + '/lab');
			}
		}
	});
};


// TODO: On every action, check if lab has ended and update validation if expired

function get_random_version(req, res, lab_number, part_number, next) { // get -or- checkout
	collection_lab_versions.find({
		lab_number: parseInt(lab_number),
		part_number: parseInt(part_number)
	}, {}, function (err, versions) {
		if (err || !versions) {
			if (part_number <= 2) {
				log.error("error finding lab versions for lab " + lab_number + " part " + part_number + " - " + err);
				res.redirect('/courses/' + req.params.course + '/lab');
			} else {
				// TODO: end of lab (except AutoLab submission)
				next(req, res, "done");
			}
		} else {
			var version_number = Math.floor(Math.random() * versions.length);
			var version = versions[version_number];
			next(req, res, version);
		}
	});

	//{
	//	"lab_number": 1,
	//	"part_number": 1,
	//	"version_number": 1,
	//	"questions_required":10,
	//	"instruction_text": "You have an Internet data plan that charges $10/GB"
	//}
}

function get_random_question(req, res, lab_number, part_number, version_number, next) {
	console.log(lab_number + ","+ part_number+ ","+ version_number);
	collection_lab_questions.find({
		lab_number: parseInt(lab_number),
		part: parseInt(part_number),
		version: parseInt(version_number)
	}, {}, function (err, questions) {
		if (err || !questions) {
			log.warn("error finding lab question");
		} else {
			var question_number = Math.floor(Math.random() * questions.length);
			var question = questions[question_number];
			//console.log("question: " + question);
			//console.log("questions: " + questions);
			collection_ps.update({username: req.user.username}, {$set: {"current_lab_attempt.current_question": question}}, function (err, x) {
				next(req, res, question);
			});
		}
	});
	//{
	//	"lab_number": 1,
	//	"part": 1,
	//	"version": 1,
	//	"question_number": 0,
	//	"parameters": {
	//	"data_used": 20,
	//		"units": "GB"
	//},
	//	"question_text": "How much will it cost to use 20.0 GB of data?",
	//	"grader": {
	//	"expected": 200,
	//		"comparator": "double"
	//}
	//}
}



function resume_lab(req, res, lab_attempt) {
// {{lab.lab_number}}
// {{lab.title}}
// {{lab.instruction_text}}
// {{lab.lab_number}}
// {{part.instruction_text}}
// {{quetion.question_text}}
//{{course.course}}

	//var lab_attempt_example =
	//{
	//	"lab_id": "lab1",
	//	complete: false,
	//	current_part: 1,
	//	version_number: 2,
	//	part_questions_completed: 2,
	//	part_questions_required: 5,
	//	all_parts_complete: false,
	//	autolab_complete: false,
	//	current_question: {}
	//};

	//{
	//	"lab_number": 1,
	//	"part_number": 2,
	//	"version_number": 1,
	//	"questions_required":10,
	//	"instruction_text": "You have an Internet connection with a download speed of 40 Mbps.In a class named \"Lab1\" Write a public static method named \"downloadTime\" that will take a double as a parameter representing a file size in GB that returns a double representing the number of seconds it will take to download the file. This method will be submitted to AutoLab after answering 10 questions.\nNote: Mbps stands for MegaBits per second and file sizes are given in GigaBytes. There are 8 bits in a byte"
	//}

	collection_labs.findOne({"lab_id": lab_attempt.lab_id}, {}, function (err, lab) {
		res.to_template.lab = lab;
		collection_lab_versions.findOne({
			lab_number: parseInt(lab_attempt.lab_number),
			part_number: parseInt(lab_attempt.current_part),
			version_number: parseInt(lab_attempt.version_number)
		}, {}, function (err, version) {
			res.to_template.part = version;

			//"lab_number": 1,
			//	"part": 1,
			//	"version": 1,
			//	"question_number": 0,
			//	"parameters": {
			//	"data_used": 20,
			//		"units": "GB"
			//},
			//"question_text": "How much will it cost to use 20.0 GB of data?",

			//if (!lab_attempt.current_question) {
			get_random_question(req, res, lab_attempt.lab_number, lab_attempt.current_part, lab_attempt.version_number, function (req, res, question) {

				collection_lab_questions.findOne({
					lab_number: parseInt(lab_attempt.lab_number),
					part: parseInt(lab_attempt.current_part),
					version: parseInt(lab_attempt.version_number),
					question_number: parseInt(question.question_number)
				}, {}, function (err, question) {
					res.to_template.question = question;
					res.render('questions/lab_active', res.to_template);
				});

			});
			//}


		});
	});


}

function end_lab() {
	// move current lab to attempted labs. Occurs when lab is completed or time runs out
}

function start_new_lab(req, res, username, lab_number) {

	lab_number = parseInt(lab_number);
	// get first question
	collection_labs.findOne({lab_id: "lab" + lab_number}, {}, function (err, lab) {
		if (err || !lab) {
			log.warn(username + ": lab " + lab_number + " not found while attempting to start - " + err);
			res.redirect('/courses/' + req.params.course + '/lab');
		} else {
			if (!lab.released) {
				req.flash("warning", "Lab " + lab_number + " has not been released");
				log.warn(username + " attempted to start lab " + lab_number + " before it was released");
				res.redirect('/courses/' + req.params.course + '/lab');
			} else {
				collection_ps.findOne({username: username}, {}, function (err, user_ps) {
					var number_of_attempts = 0;
					if (user_ps.lab_attempts_this_session) {
						number_of_attempts = user_ps.lab_attempts_this_session;
					}
					if (number_of_attempts > 1) {
						req.flash("Already completed 2 labs this session");
						log.info(username + ": Attempted more than 2 labs is a session")
						res.redirect('/courses/' + req.params.course + '/lab');
					}
					number_of_attempts++;
					get_random_version(req, res, lab_number, 1, function (req, res, version) {
						var lab_attempt =
						{
							"lab_number": parseInt(lab_number),
							"lab_id": "lab" + lab_number,
							complete: false,
							current_part: 1,
							version_number: version.version_number,
							part_questions_completed: 0,
							part_questions_required: version.questions_required,
							all_parts_complete: false,
							autolab_complete: false
						};
						collection_ps.update({username: username}, {
							$set: {
								current_lab_attempt: lab_attempt,
								lab_attempts_this_session: number_of_attempts
							}
						}, function (err, result) {
							//get_random_question(req, res, lab_number, 1, version.version_number, function (req, res, question) {
								resume_lab(req, res, lab_attempt);
							//});
						});

					});
				});
			}
		}
	})
}

function time_expired(req, res, username) {
	req.flash("error", "This lab session has ended. You may attempt this lab again in a future lab session");
	collection_ps.findOne({username: username}, {}, function (err, user_ps) {
		collection_ps.update({username: username}, {
			$set: {
				current_lab_attempt: {},
				lab_attempts_this_session: 0,
				lab_validation: false
			},
			$push: {
				previous_lab_attempts: user_ps.current_lab_attempt
			}
		}, function (err, result) {
			res.redirect('/courses/' + req.params.course + '/lab');
		});
	});
}

exports.start_lab = function start_lab(req, res, course) {
	collection_ps.findOne({username: req.user.username}, {}, function (err, user_ps) {
		if(err || !user_ps){
			req.flash("error", "There was a problem accessing the database");
			console.log(err + " | " + user_ps);
			res.redirect('/courses/' + req.params.course + '/lab');
		}
		if (!user_ps.lab_validation) {
			req.flash("error", "You need to check into lab with a TA before starting a lab");
			res.redirect('/courses/' + req.params.course + '/lab');
		} else if (user_ps.valid_until < Date.now()) {
			time_expired(req, res, req.user.username);
		} else {
			if (user_ps.current_lab_attempt && Object.keys(user_ps.current_lab_attempt).length > 0) {
				resume_lab(req, res, user_ps.current_lab_attempt);
			} else {
				console.log("ggg: " + req.params.lab_number);
				start_new_lab(req, res, req.user.username, req.params.lab_number);
			}
		}
	});
	// Check if user is still checked in. If not, close current lab if it exists

	//console.log("starting lab " + req.params.lab_number);
	// TODO: Check if a lab is already active. Make sure this lab can be checked out. Make sure it hasn't been completed

	// TODO: If no active lab, check one out matching the lab number


	//resume_lab();

	//res.render('questions/lab_active', res.to_template);
};


exports.answer_lab_question = function answer_lab_question(req, res, course) {
	// Check if user is still checked in. If not, close current lab if it exists
	collection_ps.findOne({username: req.user.username}, {}, function (err, user_ps) {
		if (!user_ps.lab_validation) {
			req.flash("error", "You need to check into lab with a TA before starting a lab");
			res.redirect('/courses/' + req.params.course + '/lab');
		} else if (user_ps.valid_until < Date.now()) {
			time_expired(req, res, req.user.username);
		} else {
			var computed = req.body.student_answer;
			var current_lab_attempt = user_ps.current_lab_attempt;
			var current_question = current_lab_attempt.current_question;
			var grader = current_question.grader;
			var correct = false;
			if (grader.comparator === "double") {
				correct = compare.doubles(grader.expected, computed);
			} else if (grader.comparator === "integer") {
				correct = compare.integers(grader.expected, computed);
			} else if (grader.comparator === "string") {
				correct = compare.string(grader.expected, computed);
			}
			if (correct) {
				req.flash("success", "Question correct");
				var questions_correct = current_lab_attempt.part_questions_completed + 1;
				if (questions_correct >= current_lab_attempt.part_questions_required) {
					var next_part = parseInt(current_lab_attempt.current_part) + 1;
					current_lab_attempt.current_part++;
					collection_ps.update({username: req.user.username}, {
						$set: {
							"current_lab_attempt.part_questions_completed": 0,
							"current_lab_attempt.current_part": next_part
						}
					}, function (err, record) {
						get_random_version(req, res, parseInt(current_lab_attempt.lab_number), next_part, function (req, res, version) {
							if (version === "done") {
								collection_ps.update({username: req.user.username}, {$set: {"current_lab_attempt.all_parts_complete": true}}, function (err, record) {
									if (user_ps.current_lab_attempt.autolab_complete) {
										collection_ps.update({username: req.user.username}, {$set: {"current_lab_attempt.complete": true}}, function (err, record) {
											req.flash("success", "Completed lab " + current_lab_attempt.lab_number);
											// TODO: Call completed lab to move current_lab to the finished labs and such
											res.redirect('/courses/' + req.params.course + '/lab');
										});
									}
								});
							} else {
								resume_lab(req, res, current_lab_attempt);
							}
						});

						//get_random_question(current_lab_attempt.lab_number, current_lab_attempt.part_number, current_lab_attempt.version_number, function (question) {
						//	res.to_template.question = question;
						//	res.render('questions/lab_active', res.to_template);
						//})
					});
				} else {
					collection_ps.update({username: req.user.username}, {$set: {"current_lab_attempt.part_questions_completed": questions_correct}}, function (err, record) {
						//get_random_question(req, res, current_lab_attempt.lab_number, current_lab_attempt.current_part, current_lab_attempt.version_number, function (req, res, question) {
						//	res.to_template.question = question;
						//	res.render('questions/lab_active', res.to_template);
						//})
						resume_lab(req, res, current_lab_attempt);
					});
				}
			}else{
				req.flash("error", "Question incorrect");
				resume_lab(req, res, current_lab_attempt);
			}

			//"grader": {
			//	"expected": 200,
			//  "comparator": "double"
			//}


			//var lab_attempt_example =
			//{
			//	"lab_id": "lab1",
			//	complete: false,
			//	current_part: 1,
			//	version_number: 2,
			//	part_questions_completed: 2,
			//	part_questions_required: 5,
			//	all_parts_complete: false,
			//	autolab_complete: false,
			//	current_question:{}
			//	//all_attempts: []
			//};

			//collection_lab_questions.findOne({}, {}, function (err, question) {
			//
			//})
		}
	});
	// get another question
};


// API
// ~Checkout Lab (Generate type/variant) (cap at 2/session)
// ~Get next input/question based on type/variant
// ~Submit answer to current input (and get next input/question) (check if phase satisfied, move to next phase)
// AutoLab asks what lab to grade (section_id)
// AutoLab says you've completed this part (mark AutoLab satisfied)

exports.lab_api = function lab_api(req, res, course) {
	//console.log("API: " + req.body);
	if (req.body.key !== "super_secret_key") {
		res.send("You can't use this API");
		log.error("VIOLATION: Bad access to lab API" + req.body)
	} else if (!req.headers['user-agent']) {
		res.send("You can't use this API");
		log.error("VIOLATION: Bad user-agent to lab API" + req.body)
	} else if (req.body.request_type === "get_current_lab") {
		api_get_current_lab(req, res, course);
	} else if (req.body.request_type === "send_lab_results") {
		api_send_lab_results(req, res, course);
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
			log.error("No user found with section_id: " + section_id);
			res.send("No user found with section_id: " + section_id);
		} else {
			res.send(JSON.stringify(record.current_lab_attempt))
		}
	});
}

function api_send_lab_results(req, res, course) {
	var section_id = req.body.section_id;
	var complete = req.body.complete;
	if (!complete) {
		res.send("Why did you send this?");
	} else {
		collection_ps.findOne({"section_id": section_id}, {}, function (err, user_ps) {
			if (err) {
				console.log("database error in api_send_lab_results: " + err);
				log.error(section_id + "error in api_send_lab_results");
				res.send("database error");
			} else if (!user_ps) {
				res.send("No user found with section_id " + section_id);
			} else {

				log.info(section_id + ": completed AutoLab for " + user_ps.current_lab_attempt.lab_id);
				collection_ps.update({"section_id": section_id}, {$set: {"current_lab_attempt.autolab_complete": true}});
				// Check for lab complete
				if (user_ps.current_lab_attempt.all_parts_complete) {
					collection_ps.update({"section_id": section_id}, {$set: {"current_lab_attempt.complete": true}}, function (err, record) {
						//req.flash("success", "Completed lab " + current_lab_attempt.lab_number);
						//res.redirect('/courses/' + req.params.course + '/lab');

					});
				}
				res.send("AutoLab Complete");

			}
		});

	}
}
