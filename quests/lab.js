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



// TODO:
//1|educatio | GET /courses/cse115-s18/assignments/lab 200 94.316 ms - 14124
//1|educatio | GET /static/UBStylin.css 200 1.179 ms - 11148
//1|educatio | GET /static/functions.js 200 3.437 ms - 3303
//1|educatio | (node:20848) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 4):
// TypeError: Cannot read property 'current_lab_attempt' of undefined
//1|educatio | GET /courses/cse115-s18/active-lab/3 - - ms - -

// entry point
exports.get_lab = function get_lab(req, res, course) {

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
				//console.log(JSON.stringify(user_ps, null, 2));
				res.to_template.user_ps = user_ps;
				collection_labs.find({}, {}, function (err, all_labs) {

					for (var i = 0; i < all_labs.length; i++) {
						var this_lab = all_labs[i];
						var user_lab = user_ps.labs[this_lab.lab_id];
						if (user_lab) {
							all_labs[i].complete = user_lab.complete;
						} else {
							all_labs[i].complete = false;
						}
					}
					//console.log(all_labs);
					res.to_template.labs = all_labs;
					res.to_template.level_name = level_requirements.get_level_requirements(user_ps.level).level_name;

					collection_tas.findOne({username: req.user.username}, {}, function (err, record) {
						res.to_template.user_is_TA = !err && record;
						if (res.to_template.user_is_TA) {
							for (var i = 0; i < all_labs.length; i++) {
								all_labs[i].released = true;
							}

							// lab always active for TAs (20 hours every time they visit this page)
							collection_ps.update({username: req.user.username}, {
								$set: {
									lab_validation: true,
									valid_until: Date.now() + 72000000,
									lab_attempts_this_session: 0
								}
							}, function (err, record) {
								res.render('questions/lab', res.to_template);
							});
						} else {
							res.render('questions/lab', res.to_template);
						}
					});
				});
			}
		});
	}
};


exports.lab_check_in = function lab_check_in(req, res, course) {
	//console.log(req.user);
	collection_tas.find({username: req.user.username}, {}, function (err, user) {
		if (err || !user) {
			req.flash("error", "You can't do that");
			log.warn(req.user.username + ": Unauthorized to check a student into lab - " + req.body.scan);
			res.redirect('/courses/' + req.params.course + '/lab');
		} else {
			if (req.body.scan) {
				var scan = req.body.scan;
				//var person = card_scanner.scan_to_person(scan);
				card_scanner.scan_to_username(scan, req, res, function (req, res, user_ps) {
					if (!user_ps) {
						req.flash("error", "User not found. Please rescan");
						log.warn(req.user.username + ": Failed to check a student into lab - " + req.body.scan + " | " + JSON.stringify(user_ps));
						res.redirect('/courses/' + req.params.course + '/lab');
					} else {

						// Find the end of lab. Assumes labs start on a even numbered hour TODO: Add actual lab sections
						var ten_minutes = 1000 * 60 * 10;
						var valid_until = new Date(Date.now() + ten_minutes);
						var hour_adjustment = valid_until.getHours() % 2 === 0 ? 1 : 0;
						valid_until.setHours(valid_until.getHours() + hour_adjustment);
						valid_until.setMinutes(50);
						valid_until.setSeconds(0);

						if (user_ps.lab_validation && user_ps.valid_until < Date.now()) {
							// In case they never hit a time expired before checking in next week. This would let them pick up where they left off


							var to_set = {
								current_lab_attempt: {},
								lab_validation: true,
								valid_until: valid_until,
								lab_attempts_this_session: 0
							};

							if(user_ps && user_ps.current_lab_attempt && Object.keys(user_ps.current_lab_attempt).length > 0) {

								if (user_ps.current_lab_attempt.all_parts_complete &&
									user_ps.current_lab_attempt.autolab_complete) {

									to_set["labs." + user_ps.current_lab_attempt.lab_id + ".complete"] = true;
								}
							}

							collection_ps.update({username: user_ps.username}, {
								$push: {
									previous_lab_attempts: user_ps.current_lab_attempt,
									all_validations: {"ta": req.user.username, "timestamp": Date.now()}
								},
								$set: to_set
							}, function (err, result) {
								req.flash("success", user_ps.username + " checked into lab");
								log.info(user_ps.username + " was checked into lab by " + req.user.username);
								res.redirect('/courses/' + req.params.course + '/lab');
							});
						} else {
							collection_ps.update({username: user_ps.username}, {
								$set: {
									lab_validation: true,
									valid_until: valid_until,
									lab_attempts_this_session: 0
								},
								$push: {
									all_validations: {"ta": req.user.username, "timestamp": Date.now()}
								}
							}, function (err, record) {
								req.flash("success", user_ps.username + " checked into lab");
								log.info(user_ps.username + " was checked into lab by " + req.user.username);
								res.redirect('/courses/' + req.params.course + '/lab');
							});
						}
					}

				});
			} else {
				res.redirect('/courses/' + req.params.course + '/lab');
			}
		}
	});
};


function get_random_version(req, res, lab_number, part_number, user_ps, next) { // get -or- checkout
	collection_lab_versions.find({
		lab_number: parseInt(lab_number),
		part_number: parseInt(part_number)
	}, {sort: {version_number: 1}}, function (err, versions) {
		if (err || !versions || versions.length == 0) {
			if (part_number <= 2) {
				log.error("error finding lab versions for lab " + lab_number + " part " + part_number + " - " + err);
				req.flash("error", "Could not find lab version");
				res.redirect('/courses/' + req.params.course + '/lab');
			} else {
				next(req, res, "done");
			}
		} else {
			var version_priority = [];
			for (var index = 0; index < versions.length; index++) {
				version_priority.push(0);
			}
			if (user_ps.previous_lab_attempts) {
				for (var i = 0; i < user_ps.previous_lab_attempts.length; i++) {
					var attempt = user_ps.previous_lab_attempts[i];
					if (attempt && attempt.lab_number === lab_number &&
						attempt.current_part === part_number &&
						attempt.version_number != undefined && version_priority[attempt.version_number] != undefined) {
						version_priority[attempt.version_number] = version_priority[attempt.version_number] + 1;
					}
				}
			}
			var most_priority = Math.min.apply(null, version_priority);
			var best_versions = [];
			for (var index = 0; index < versions.length; index++) {
				if (version_priority[index] === most_priority) {
					best_versions.push(versions[index]);
				}
			}
			var index_number = Math.floor(Math.random() * best_versions.length);
			var version = best_versions[index_number];
			next(req, res, version);
		}
	});
}

function get_random_question(req, res, lab_number, part_number, version_number, next) {
	//console.log(lab_number + "," + part_number + "," + version_number);
	collection_lab_questions.find({
		lab_number: parseInt(lab_number),
		part: parseInt(part_number),
		version: parseInt(version_number)
	}, {}, function (err, questions) {
		if (err || !questions) {
			log.warn("error finding lab question: " + err);
			req.flash("error", "Could not find question");
			res.redirect('/courses/' + req.params.course + '/lab');
		} else {
			var question_number = Math.floor(Math.random() * questions.length);
			var question = questions[question_number];
			// TODO: Track past questions. Avoid repeats if possible
			collection_ps.update({username: req.user.username}, {$set: {"current_lab_attempt.current_question": question}}, function (err, x) {
				next(req, res, question);
			});
		}
	});
}


function resume_lab(req, res, lab_attempt) {

	collection_ps.findOne({username: req.user.username}, {}, function (err, user_ps) {
		if(err || !user_ps){
			log.warn("error in resume_lab: " + err);
			res.redirect('/courses/' + req.params.course + '/lab');
		}else {
			lab_attempt = user_ps.current_lab_attempt;
			//console.log(JSON.stringify(lab_attempt, null, 2));
			res.to_template.lab_attempt = lab_attempt;

			if (lab_attempt.all_parts_complete) {
				if (lab_attempt.autolab_complete) {

					//var user_lab = user_ps.labs["lab" + this_lab.lab_number];
					//if (user_lab) {
					//	all_labs[i].complete = user_lab.complete;
					var to_set = {"current_lab_attempt.complete": true};
					to_set["labs." + lab_attempt.lab_id + ".complete"] = true;

					collection_ps.update({"username": req.user.username}, {$set: to_set}, function (err, record) {
						req.flash("success", "Completed lab " + lab_attempt.lab_number);
						end_lab(req, res, req.user.username);
					});
				} else {
					req.flash("success", "All questions complete. Follow instructions to submit your code on AutoLab to complete this lab");
					collection_labs.findOne({"lab_id": lab_attempt.lab_id}, {}, function (err, lab) {
						res.to_template.lab = lab;
						res.render('questions/lab_active', res.to_template);
					});
				}
			} else {

				collection_labs.findOne({"lab_id": lab_attempt.lab_id}, {}, function (err, lab) {
					res.to_template.lab = lab;
					if (user_ps.level <= lab.lab_number) {
						req.flash("warn", "You are underleveled. The recommended level for this lab is " + (lab.lab_number + 1))
					}
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
							if (!question) {
								req.flash("success", "No more questions to answers. Submit on AutoLab");
								res.render('questions/lab_active', res.to_template);
							} else {
								collection_lab_questions.findOne({
									lab_number: parseInt(lab_attempt.lab_number),
									part: parseInt(lab_attempt.current_part),
									version: parseInt(lab_attempt.version_number),
									question_number: parseInt(question.question_number)
								}, {}, function (err, question) {

									res.to_template.question = question;
									res.render('questions/lab_active', res.to_template);
								});
							}

						});
						//}


					});
				});
			}
		}
	});

}

function end_lab(req, res, username) {
	// move current lab to attempted labs. Occurs when lab is completed or time runs out
	collection_ps.findOne({username: username}, {}, function (err, user_ps) {
		collection_ps.update({username: username}, {
			$push: {
				previous_lab_attempts: user_ps.current_lab_attempt
			},
			$set: {
				current_lab_attempt: {}
			}
		}, function (err, result) {
			res.redirect('/courses/' + req.params.course + '/lab');
		});
	});
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
				req.flash("error", "Lab " + lab_number + " has not been released");
				log.info(username + " attempted to start lab " + lab_number + " before it was released");
				res.redirect('/courses/' + req.params.course + '/lab');
			} else {
				collection_ps.findOne({username: username}, {}, function (err, user_ps) {
					if (user_ps.labs["lab" + lab_number] && user_ps.labs["lab" + lab_number].complete) {
						req.flash("success", "You already completed this lab");
						log.info(username + ": Attempted to retry a completed lab: lab" + lab_number);
						res.redirect('/courses/' + req.params.course + '/lab');
						//} else if (user_ps.level <= lab.lab_number) {
						// TODO: Activate this if there are issues with underleveled students
						//req.flash("error", "You are underleveled. The required level for this lab is " + (lab.lab_number + 1));
						//res.redirect('/courses/' + req.params.course + '/lab');
					} else {
						var number_of_attempts = 0;
						if (user_ps.lab_attempts_this_session) {
							number_of_attempts = user_ps.lab_attempts_this_session;
						}
						if (number_of_attempts > 1) {
							req.flash("error", "Already completed 2 labs this session");
							log.info(username + ": Attempted more than 2 labs is a session");
							res.redirect('/courses/' + req.params.course + '/lab');
						} else {
							number_of_attempts++;
							get_random_version(req, res, lab_number, 1, user_ps, function (req, res, version) {
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
									resume_lab(req, res, lab_attempt);
								});

							});
						}
					}
				});
			}
		}
	})
}

function time_expired(req, res, username) {
	req.flash("error", "This lab session has ended. You may attempt this lab again in a future lab session");

	collection_ps.findOne({username: username}, {}, function (err, user_ps) {



		var to_set = {
			lab_attempts_this_session: 0,
			lab_validation: false
		};

		if(user_ps && user_ps.current_lab_attempt && Object.keys(user_ps.current_lab_attempt).length > 0) {
			if (user_ps.current_lab_attempt.all_parts_complete &&
				user_ps.current_lab_attempt.autolab_complete) {

				to_set["labs." + user_ps.current_lab_attempt.lab_id + ".complete"] = true;
				to_set["current_lab_attempt.complete"] = true;
			}
		}

		collection_ps.update({username: username}, {
			$set: to_set
		}, function (err, result) {
			end_lab(req, res, username);
		});
	});
}

exports.start_lab = function start_lab(req, res, course) {
	if (!req.user) {
		res.redirect('/courses/' + req.params.course + '/lab');
	} else {
		collection_ps.findOne({username: req.user.username}, {}, function (err, user_ps) {
			if (err || !user_ps) {
				req.flash("error", "There was a problem accessing the database");
				console.log(err + " | " + user_ps);
				res.redirect('/courses/' + req.params.course + '/lab');
			} else if (!user_ps.lab_validation) {
				req.flash("error", "You need to check into lab with a TA before starting a lab");
				res.redirect('/courses/' + req.params.course + '/lab');
			} else if (user_ps.valid_until < Date.now()) {
				time_expired(req, res, req.user.username);
			} else {
				if (user_ps.current_lab_attempt && Object.keys(user_ps.current_lab_attempt).length > 0) {
					req.flash("success", "Resuming lab in progress");
					resume_lab(req, res, user_ps.current_lab_attempt);
				} else {
					//console.log("ggg: " + req.params.lab_number);
					start_new_lab(req, res, req.user.username, req.params.lab_number);
				}
			}
		});
	}
};


exports.answer_lab_question = function answer_lab_question(req, res, course) {
	// Check if user is still checked in. If not, close current lab if it exists
	if (!req.user) {
		res.redirect('/courses/' + req.params.course + '/lab');
	} else {
		collection_ps.findOne({username: req.user.username}, {}, function (err, user_ps) {
			if (err || !user_ps) {
				req.flash("error", "Could not find your lab");
				log.error("Could not find your lab: " + err + " | " + user_ps);
				res.redirect('/courses/' + req.params.course + '/lab');
			} else if (!user_ps.lab_validation) {
				req.flash("error", "You need to check into lab with a TA before starting a lab");
				res.redirect('/courses/' + req.params.course + '/lab');
			} else if (user_ps.valid_until < Date.now()) {
				time_expired(req, res, req.user.username);
			} else if (!user_ps.current_lab_attempt.current_question) {
				resume_lab(req, res, user_ps.current_lab_attempt);
			} else {
				res.to_template.user_ps = user_ps;

				var computed = req.body.student_answer;
				var current_lab_attempt = user_ps.current_lab_attempt;
				var current_question = current_lab_attempt.current_question;
				//console.log(JSON.stringify(current_lab_attempt));
				var grader = current_question.grader;
				//console.log("***");
				//console.log(grader.expected);
				//console.log(computed);
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
							get_random_version(req, res, parseInt(current_lab_attempt.lab_number), next_part, user_ps, function (req, res, version) {
								if (version === "done") {
									collection_ps.update({username: req.user.username}, {$set: {"current_lab_attempt.all_parts_complete": true}}, function (err, record) {
										//if (user_ps.current_lab_attempt.autolab_complete) {
										//	collection_ps.update({username: req.user.username}, {$set: {"current_lab_attempt.complete": true}}, function (err, record) {
										//		req.flash("success", "Completed lab " + current_lab_attempt.lab_number);
										//		res.redirect('/courses/' + req.params.course + '/lab');
										//});
										//}
										resume_lab(req, res, current_lab_attempt); // resume_lab checks if AutoLab is sat
									});
								} else {

									//"version_number": 0,
									//	"questions_required": 5,
									collection_ps.update({username: req.user.username},
										{
											$set: {
												"current_lab_attempt.version_number": version.version_number,
												"current_lab_attempt.part_questions_required": version.questions_required
											}
										}, function (err, record) {

											if (version.autolab_instructions) {
												if (current_lab_attempt.autolab_instructions) {
													log.warn("Already has autolab instructions. Look into this");
												}
												current_lab_attempt.autolab_instructions = version.autolab_instructions;
												collection_ps.update({username: req.user.username}, {$set: {"current_lab_attempt.autolab_instructions": version.autolab_instructions}}, function (err, record) {
													resume_lab(req, res, current_lab_attempt);
												});
											} else {
												resume_lab(req, res, current_lab_attempt);
											}
										});
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
				} else {
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
	}
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
		log.error("VIOLATION: Bad access to lab API" + JSON.stringify(req.body))
	} else if (!req.headers['user-agent']) {
		res.send("You can't use this API");
		log.error("VIOLATION: Bad user-agent to lab API" + JSON.stringify(req.body))
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
	log.error("VIOLATION DETECTED" + JSON.stringify(req.body));
	res.send("Violation");
}

function api_get_current_lab(req, res, course) {
	var section_id = req.body.section_id;
	collection_ps.findOne({"section_id": section_id}, {}, function (err, record) {
		if (err) {
			log.error("database error in api_get_current_lab: " + err);
			res.send("database error");
		} else if (!record) {
			log.error("No user found with section_id: " + section_id);
			res.send("No user found with section_id: " + section_id);
		} else if (record.valid_until < Date.now()) {
			// TODO: Check how this looks in AutoLab. It might be gross
			time_expired(req, res, req.user.username);
		}else {
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
				//console.log("database error in api_send_lab_results: " + err);
				log.error(section_id + ": error in api_send_lab_results - " + err);
				res.send("error");
			} else if (!user_ps) {
				res.send("No user found with section_id: " + section_id);
			}else if (user_ps.valid_until < Date.now()) {
				// TODO: Check how this looks in AutoLab. It might be gross
				time_expired(req, res, req.user.username);
			} else {
				log.info(user_ps.username + ": completed AutoLab for " + user_ps.current_lab_attempt.lab_id);

				var to_set = {"current_lab_attempt.autolab_complete": true};
				if (user_ps.current_lab_attempt &&
					user_ps.current_lab_attempt.all_parts_complete) {
					to_set["labs." + user_ps.current_lab_attempt.lab_id + ".complete"] = true;
					to_set["current_lab_attempt.complete"] = true;
				}

				collection_ps.update({"section_id": section_id},
					{
						$set: to_set
					}, function (err, x) {
						res.send("AutoLab Complete");
					});

			}
		});

	}
}
