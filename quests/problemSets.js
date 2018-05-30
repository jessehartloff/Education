var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var level_requirements = require('./level_requirements/requirements');
var log = require('winston');

var collection_ps = db.get('ps');
var collection_questions = db.get('questions');

var current_course = 'cse115-s18';


// TODO: Remind them of office hours after poor performance

// Add consumable multipliers that can be awarded to to individuals or to the entire class. Quantity should be stored. Could have different values as well. For each type they have, a new button appears next to the check out PS button. They can earn these in many ways (1.2x for attending office hours, several 1.5x for response rates, several 1.2 for completing 442 tasks?)
// TODO: Cleanup code
// Register students. Set fixed section numbers and check for new students w/o a number as they add/drop. No reassignments or duplicates
// Syllabus w/ grading
// TODO: Make a card for each concept
// Display first PS just like the others. Display card for each PS
// TODO: Check if they have testing code in main
// TODO: Killing Spree
// TODO: Notifications when they unlock hw / reach recommended level for labs
// TODO: Tie into office hours tracking/queueing
// TODO: idea - Eclipse che for lecture code. Students can see it live in their browser and the examples can be saved


function instructions_to_javadoc(question, question_number, max_width, indent) {

	var instructions = "q" + question_number.toString() + ": ";

	instructions += "Write a public static method named q" +
		question_number.toString() + " that" + question.instruction_text;

	return to_javadoc(instructions);
}

function to_javadoc(instructions, max_width, indent) {
	if (!max_width) {
		max_width = 90;
	}
	if (!indent) {
		indent = "    "
	}

	var line = "";

	var docs = indent + "/**\n";
	var last_space = 0;

	for (var i = 0; i < instructions.length; i++) {
		line += instructions.charAt(i);
		if (instructions.charAt(i) === " ") {
			last_space = line.length;
		} else if (instructions.charAt(i) === "\n") {
			docs += indent + " * " + line;
			line = "";
			last_space = 0;
		}

		if (line.length > max_width && last_space != 0) {
			docs += indent + " * " + line.slice(0, last_space) + "\n";
			line = line.slice(last_space, line.length);
			last_space = 0;
		}

	}

	if (line.length > 0) {
		docs += indent + " * " + line + "\n";
	}
	docs += indent + " */\n";
	return docs;
}

function java_class_name(problem_set) {
	var number = problem_set.ps_number.toString();
	while (number.length < 4) {
		number = '0' + number;
	}
	return "ProblemSet_" + problem_set.assigned_username + "_" + number;
}

function build_ps_text(problem_set) {

	var class_name = java_class_name(problem_set);

	var ps = "";
	ps += "public class " + class_name + "{\n";
	ps += "    \n";
	ps += "    \n";


	var inner_classes = false;
	for (var index in problem_set.questions) {
		var this_question = problem_set.questions[index];
		if (this_question &&
			(this_question.concept === "classes" || this_question.concept === "inheritance" ||
			this_question.concept === "polymorphism" || this_question.concept === "json")) {
			inner_classes = true;
		}
	}
	if (inner_classes) {
		ps += to_javadoc("Note: In this problem set level you will use inner classes by defining " +
			"custom classes inside the " + class_name + " class. This is only done so you can submit multiple classes in a " +
			"single java file on AutoLab. In most cases it is better " +
			"practice to define each class in a separate file instead of using inner classes.\n\nFor labs and projects " +
			"you will write " +
			"your classes in separate files and submit a single jar file containing your entire project");
		ps += "    \n";
		ps += "    \n";
		ps += "    \n";
	}


	var question_number = 1;
	for (var i = 0; i < problem_set.questions.length; i++) {
		var the_question = problem_set.questions[i];
		if (!the_question) {
			console.log("question is null");
			continue;
		}

		if ((the_question.concept === "classes" || the_question.concept === "inheritance" ||
			the_question.concept === "polymorphism" || the_question.concept === "json" ||
			the_question.concept === "challenge")) {
			ps += to_javadoc("q" + question_number + ": " + the_question.instruction_text);
		} else {
			ps += instructions_to_javadoc(the_question, question_number);
		}

		ps += "    \n";
		ps += "    \n";
		ps += "    \n";
		ps += "    \n";

		question_number++;
	}

	ps += "    public static void main(String[] args){\n";
	ps += "        \n";

	if (inner_classes) {
		ps += "        /* Use the following syntax to instantiate your inner class for testing */\n";
		ps += "        " + class_name + " outerInstance = new " + class_name + "();\n";
		ps += "        //InnerClassName innerInstance = outerInstance.new InnerClassName();\n";
		ps += "        \n";
	}

	ps += "        /* Test your code here to verify it is correct before submitting */\n";
	ps += "        \n";
	ps += "    }\n";
	ps += "}\n";

	return ps;
}


// entry point
exports.get_ps = function get_ps(req, res, course) {
	if (!req.user) {
		res.render('questions/ps', res.to_template);
	} else {
		collection_ps.findOne({"username": req.user.username}, {}, function (err, user_ps) {
			if (err) {
				console.log("database error in get_ps: " + err);
				req.flash("error", "Database error 1");
				log.error(req.user.username + ": in get_ps");
				res.render('questions/ps', res.to_template);
			} else if (!user_ps) {
				console.log("user not enrolled for problem sets: " + req.user.username);
				log.warn(req.user.username + ": not enrolled in problem sets");
				req.flash("error", "User " + req.user.username + " is not registered for this feature. If you are enrolled in CSE115 send and email to hartloff@buffalo.edu with the subject \"CSE115 Problem Set Registration\" immediately to unlock problem sets");
				res.render('questions/ps', res.to_template);
			} else {
				res.to_template.user_ps = user_ps;

				// retrieve and sort all problem sets
				var ps_completed = [];
				for (var i in user_ps.all_ps_assigned) {
					var prepared_ps = user_ps.all_ps_assigned[i];
					for (var j in prepared_ps.questions) {
						if (!prepared_ps.questions[j]) {
							continue;
						}
						if (prepared_ps.results) {
							if (i !== user_ps.current_ps.ps_number.toString() || user_ps.current_ps_finished) {
								prepared_ps.questions[j]["correct"] = prepared_ps.results[j].correct;
								prepared_ps.questions[j]["feedback"] = prepared_ps.results[j].feedback;
							}
						}
					}
					ps_completed.push(prepared_ps);

				}
				ps_completed.sort(function (a, b) {
					// sorts reverse alphabetically
					return b.ps_number - a.ps_number;
				});
				res.to_template.ps_completed = ps_completed;

				if (user_ps.leveled_up) {
					res.to_template.leveled_up = true;
					collection_ps.update({username: req.user.username}, {$set: {leveled_up: false}});
				}

				// determine active loop section
				if (user_ps.current_ps_finished) {
					res.to_template.new_ps_active = true;
				} else {
					res.to_template.submit_ps_active = true;
				}
				//grading_ps_active
				// TODO: future tech - When sockets and hook are implemented. Give them something to do while grading


				// retrieve xp and level stats
				res.to_template.xp_for_next_level = level_requirements.get_level_requirements(user_ps.level).xp_for_next_level;
				if (user_ps.level > 1) {
					res.to_template.xp_for_previous_level = level_requirements.get_level_requirements(user_ps.level - 1).xp_for_next_level;
				} else {
					res.to_template.xp_for_previous_level = 0;
				}
				res.to_template.xp_percentage_to_next_level = 100 * (user_ps.total_xp - res.to_template.xp_for_previous_level) / (res.to_template.xp_for_next_level - res.to_template.xp_for_previous_level);

				res.to_template.level_name = level_requirements.get_level_requirements(user_ps.level).level_name;
				res.to_template.next_level_name = level_requirements.get_level_requirements(user_ps.level + 1).level_name;

				// ship it
				res.render('questions/ps', res.to_template);
			}
		});
	}
};


function get_random_question(concept, type, questions_list) {
	return collection_questions.find({"concept": concept, "type": type}, function (err, questions) {
		var question = questions[Math.floor(Math.random() * questions.length)];
		questions_list.push(question);
	});
}


function generate_new_ps(req, res, user_ps, next) {

	var new_ps_number = user_ps.current_ps.ps_number + 1;
	log.info(req.user.username + ": generating problem set " + new_ps_number.toString());

	var previous_generation_time = user_ps.current_ps.time_generated;
	var ms_in_day = 1000 * 60 * 60 * 24;

	var point_value = 100.0;
	var multipliers = [];
	if (Math.floor(Date.now() / ms_in_day) !== Math.floor(previous_generation_time / ms_in_day)) {
		log.info(req.user.username + ": first problem set of the day");
		multipliers.push({"reason": "First Problem Set of the Day", "multiplier": 1.5});
		point_value *= 1.5;
	}

	var multiplier = "none";
	if (req.query.multiplier) {
		multiplier = req.query.multiplier;
	}

	if (multiplier === "small") {
		if (user_ps.small_multipliers_remaining > 0) {
			multipliers.push({"reason": "Used consumable multiplier", "multiplier": 1.2});
			var small_remaining = user_ps.small_multipliers_remaining - 1;
			collection_ps.update({username: user_ps.username}, {$set: {small_multipliers_remaining: small_remaining}});
		} else {
			req.flash("error", "You don't have any 1.2x consumables. Checking out problem set without consumable multiplier")
		}
	} else if (multiplier === "large") {
		if (user_ps.large_multipliers_remaining > 0) {
			multipliers.push({"reason": "Used consumable multiplier", "multiplier": 1.5});
			var large_remaining = user_ps.large_multipliers_remaining - 1;
			collection_ps.update({username: user_ps.username}, {$set: {large_multipliers_remaining: large_remaining}});
		} else {
			req.flash("error", "You don't have any 1.5x consumables. Checking out problem set without consumable multiplier")
		}
	} else {
		// no multiplier used
	}


	var ps =
	{
		'assigned_username': req.user.username,
		'ps_number': new_ps_number,
		'point_value': point_value,
		"multipliers": multipliers,
		'time_generated': Date.now(),
		'time_completed': 0
	};

	ps['class_name'] = java_class_name(ps);

	var number_of_questions = 5;

	var question_types = [];

	var this_level_requirements = level_requirements.get_level_requirements(user_ps.level);
	var player_xp = user_ps.xp;
	var questions_needed = [];
	for (var index = 0; index < this_level_requirements.question_targets.length; index++) {
		var requirement = this_level_requirements.question_targets[index];

		var number_needed = requirement.cumulative_number_correct;
		if (player_xp[requirement.concept] && player_xp[requirement.concept][requirement.type]) {
			number_needed -= player_xp[requirement.concept][requirement.type];
		}

		questions_needed.push({
			"concept": requirement.concept,
			"type": requirement.type,
			"priority": number_needed
		});
	}

	for (var i = 0; i < number_of_questions; i++) {
		var highest_priority_value = Number.NEGATIVE_INFINITY;
		var highest_priority_index = -1;
		var highest_priority_question = {"concept": "variables", "type": "1"};
		for (var j = 0; j < questions_needed.length; j++) {
			if (questions_needed[j].priority > highest_priority_value) {
				highest_priority_value = questions_needed[j].priority;
				highest_priority_index = j;
				highest_priority_question = questions_needed[j];
			}
		}
		if (highest_priority_index === -1) {
			console.log("highest_priority_index = -1");
			log.warn(req.user.username + ": I've got a bad feeling about this..");
			// bad
		} else {
			question_types.push(highest_priority_question);
			questions_needed[highest_priority_index].priority -= 1;
		}
	}

	var questions = [];
	var promises = [];
	for (var j = 0; j < question_types.length; j++) {
		promises.push(get_random_question(question_types[j]["concept"], question_types[j]["type"], questions));
	}


	Promise.all(promises).then(function () {
		//questions.shuffle
		for (var i = questions.length; i > 0; i--) {
			var random_index = Math.floor(Math.random() * i);
			var temp = questions[i - 1];
			questions[i - 1] = questions[random_index];
			questions[random_index] = temp;
		}

		ps['questions'] = questions;

		var toSet = {
			current_ps_finished: false,
			current_ps: ps
		};

		toSet['all_ps_assigned.' + new_ps_number] = ps;
		user_ps.current_ps = ps;


		collection_ps.update({username: req.user.username}, {
			$set: toSet
		}, function (err) {
			next(req, res, user_ps);
		});

	});

}


function send_current_ps(req, res, user_ps) {
	var ps = user_ps.current_ps;
	res.setHeader('Content-disposition', 'attachment; filename=' + java_class_name(ps) + '.java');
	console.log("sending ps " + ps.ps_number + " to: " + req.user.username);
	log.info(req.user.username + ": downloading problem set " + ps.ps_number.toString());
	res.send(build_ps_text(ps));
}

exports.ps_download = function ps_download(req, res, course) {
	if (!req.user) {
		res.render('questions/ps', res.to_template);
	} else {
		collection_ps.findOne({"username": req.user.username}, {}, function (err, user_ps) {
			if (err) {
				console.log("database error in ps_download: " + err);
				req.flash("error", "Database error 1");
				log.error(req.user.username + ": error in ps_download");
				res.render('questions/ps', res.to_template);
			} else if (!user_ps) {
				console.log("user not enrolled for problem sets: " + req.user.username);
				log.warn(req.user.username + ": not enrolled in problem sets");
				req.flash("error", "User " + req.user.username + " is not registered for this feature. If you are enrolled in CSE115 send and email to hartloff@buffalo.edu with the subject \"CSE115 Problem Set Registration\" immediately to unlock problem sets");
				res.render('questions/ps', res.to_template);
			} else {
				if (user_ps.current_ps_finished) {
					generate_new_ps(req, res, user_ps, send_current_ps);
				} else {
					send_current_ps(req, res, user_ps);
				}
			}
		});
	}

};


exports.ps_api = function ps_api(req, res, course) {
	//console.log("API: " + req.body);
	if (req.body.key !== "super_secret_key") {
		res.send("You can't use this API");
		log.error("VIOLATION: Bad access to problem set API" + JSON.stringify(req.body))
	} else if (!req.headers['user-agent']) {
		res.send("You can't use this API");
		log.error("VIOLATION: Bad user-agent to problem set API" + JSON.stringify(req.body))
	} else if (req.body.request_type === "get_current_ps") {
		api_get_current_ps(req, res, course);
	} else if (req.body.request_type === "send_ps_results") {
		api_send_ps_results(req, res, course);
	} else if (req.body.request_type === "violation") {
		api_record_violation(req, res, course);
	} else {
		res.send("bad request type: " + req.body.request_type);
		log.warn("Problem set API bad request type: " + req.body.request_type);
	}
};

function api_record_violation(req, res, course) {
	log.error("VIOLATION DETECTED" + JSON.stringify(req.body));
	res.send("Violation");
}

function api_get_current_ps(req, res, course) {
	var section_id = req.body.section_id;

	collection_ps.findOne({"section_id": section_id}, {}, function (err, record) {
		if (err) {
			console.log("database error in api_get_current_ps: " + err);
			log.error("error in api_get_current_ps");
			res.send("database error");
		} else if (!record) {
			res.send("No user found with section_id " + section_id);
		} else {
			res.send(JSON.stringify(record.current_ps))
		}
	});
}

function api_send_ps_results(req, res, course) {
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
					console.log(req.user.username + ": error in api_send_ps_results. Question index " + i + " not found");
					log.error(req.user.username + ": error in api_send_ps_results. Question index " + i.toString() + " not found");
					continue;
				}
				if (result.correct) {
					if (!xp[question.concept]) {
						xp[question.concept] = {};
					}
					if (!xp[question.concept][question.type]) {
						xp[question.concept][question.type] = 0;
					}
					var xp_added = 1;
					if (question.concept === "challenge") {
						xp_added = 5; // effectively 1-time questions
					}
					xp[question.concept][question.type] += xp_added;
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


// Off-line Functions //

function add_ps_user(username, lab_section, number_id, section_id, next) {
	collection_ps.findOne({"username": username}, {}, function (err, record) {
		if (err) {
			console.log("database error while adding " + username + ": " + err);
		} else if (record) {
			console.log("user " + username + " already in the database");
		} else {
			var collection_entry_example =
			{
				'username': username,
				'lab_section': lab_section,
				'id': number_id, // For card swipe
				'section_id': section_id, // Unique id matching AutoLab section
				"level": 1,
				"total_xp": 0,
				'xp': {},
				'current_ps_finished': true,
				'current_ps': {
					'assigned_username': username,
					'ps_number': 0,
					'concept': 'null',
					//'submitted': true,
					'questions': [
						//{},{},{},{},{}
					]
				},
				'all_ps_assigned': {}, // keyed by ps_number
				'labs': {},
				'homework': {},
				'leveled_up': false,
				'extra': {}
			};
			collection_ps.insert(collection_entry_example, next());
			log.info(username + ": registered for problem sets with id " + section_id);
		}
	});
}


// function set_user_section_id(username, section_id){}
// function set_user_lab_section(username, lab_section){}
// function set_user_number_id(username, section_id){}

//add_ps_user("sophie", "A1", "11111111", "1234567890", function(){console.log("user added");});


function generate_comprehensive_ps() {

	var ps =
	{
		'assigned_username': "hertz",
		'ps_number': 1,
		'point_value': 100,
		"multipliers": [],
		'time_generated': Date.now(),
		'time_completed': 0
	};

	ps['class_name'] = java_class_name(ps);



	var concepts = ["variables", "methods", "data_structures", "control_flow", "algorithms", "files", "classes",
		"gui", "inheritance", "polymorphism", "networking", "json"];
	var types = ["1", "2", "3", "4", "5"];

	var questions = [];
	var promises = [];
	for (var j = 0; j < concepts.length; j++) {
		for (var k = 0; k < types.length; k++) {
			promises.push(get_random_question(concepts[j], types[k], questions));
		}
	}

	Promise.all(promises).then(function () {

		ps['questions'] = questions;

		console.log(build_ps_text(ps));


	});

}