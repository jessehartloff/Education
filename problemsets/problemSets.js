var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var users = require('../util/users');
var level_requirements = require('./level_requirements/requirements');

var collection_ps = db.get('ps');
var collection_questions = db.get('questions');

var current_course = 'cse115-s18';


var xp_example = {
	"variables": {"1": 0, "2": 1, "3": 0, "4": 0, "5": 0},
	"functions": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
	"data_structures": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
	"algorithms": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
	// ...
};

var ps_example =
{
	'assigned_username': 'hartloff',
	'ps_number': 4,
	'class_name': 'ProblemSet_hartloff_0004',
	//'concept': 'algos2',
	//'submitted': true,
	'questions': [
		{}, {}, {}, {}, {}
	],
	'multiplier': 2,
	'time_generated': 2,
	'time_completed': 3,
	'results': [
		{}, {}, {}, {}, {}
	]
};

var ps_results_example =
//{
	//'assigned_username': 'hartloff',
	//'ps_number': 4,
	//'concept': 'algos2',
	//'submitted': true,
	//'questions':
	[
		{'correct': true, 'feedback': "good job"}
		//{'number': "q1", 'correct': true, 'feedback': "good job"}
		//{'type': 4, 'variant': 521, 'correct': true, "feedback": "good job"},
		//{'type': 2, 'variant': 19, 'correct': true, "feedback": "good job"},
		//{'type': 1, 'variant': 823, 'correct': true, "feedback": "good job"},
		//{'type': 5, 'variant': 79, 'correct': true, "feedback": "good job"},
		//{'type': 3, 'variant': 372, 'correct': true, "feedback": "good job"}
	];
//}; // -or- {'submitted': false}

var question_example =
{
	"concept": "algos1",
	"type": 2,
	"variant": 42,
	"instruction_text": "Write a method that takes an ArrayList of Integers as its only parameter and outputs the " +
	"average of all the values as a double",
	"parameters": {}, // for grading
	"cards": []
};


var card_example = "Link to lecture content and videos";

function instructions_to_javadoc(instructions, width, indent) {
	if (!width) {
		width = 120;
	}
	if (!indent) {
		indent = "    "
	}

	var docs = indent + "/**\n";

	docs += indent + " * " + instructions;

	// TODO: Instructions at char max
	// look through keeping track of last space seen
	// when char+max hits, add a "\n     * " after last seen space
	// reset counter and add "     * " at \n in instructions

	docs += indent + "\n";
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
	var ps = "";
	ps += "public class " + java_class_name(problem_set) + "{\n";
	ps += "    \n";
	ps += "    \n";

	var question_number = 1;
	for (var i in problem_set.questions) {
		var instructions = problem_set.questions[i].instruction_text;

		ps += instructions_to_javadoc(instructions);
		ps += "    public static void q" + question_number.toString() + "(){\n";
		ps += "    \n";
		ps += "        /* your code for question " + question_number.toString() + " goes here */\n";
		ps += "    \n";
		ps += "    }\n";
		ps += "\n";
		ps += "\n";

		question_number++;
	}

	ps += "    public static void main(String[] args){\n";
	ps += "        \n";
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
				res.render('questions/ps', res.to_template);
			} else if (!user_ps) {
				console.log("user not enrolled for problem sets: " + req.user.username);
				req.flash("error", "User " + req.user.username + " is not registered for this feature. If you are enrolled in CSE115 send and email to hartloff@buffalo.edu with the subject \"CSE115 Problem Set Registration\" immediately to unlock problem sets");
				res.render('questions/ps', res.to_template);
			} else {
				res.to_template.user_ps = user_ps;

				// retrieve and sort previous problem sets
				var ps_completed = [];
				for (var i in user_ps.all_ps_assigned) {
					//if (i !== user_ps.current_ps.ps_number.toString()) {
					var prepared_ps = user_ps.all_ps_assigned[i];
					for (var j in prepared_ps.questions) {
						if (!prepared_ps.questions[j]) {
							continue;
						}
						if (prepared_ps.results) {
							if (i !== user_ps.current_ps.ps_number.toString()) {
								prepared_ps.questions[j]["correct"] = prepared_ps.results[j].correct;
								prepared_ps.questions[j]["feedback"] = prepared_ps.results[j].feedback;
							} else if (user_ps.current_ps_finished) {
								res.to_template.user_ps.current_ps.questions[j]["correct"] = prepared_ps.results[j].correct;
								res.to_template.user_ps.current_ps.questions[j]["feedback"] = prepared_ps.results[j].feedback;
							}
						}
					}
					if (i !== user_ps.current_ps.ps_number.toString()) {
						ps_completed.push(prepared_ps);
					}
					//}else if(user_ps.current_ps_finished){
					//	res.to_template.user_ps.current_ps["correct"] = prepared_ps.results[j].correct;
					//	res.to_template.user_ps.current_ps["feedback"] = prepared_ps.results[j].feedback;
					//}
				}
				ps_completed.sort(function (a, b) {
					// sorts reverse alphabetically
					return b.ps_number - a.ps_number;
				});
				res.to_template.ps_completed = ps_completed;

// todo: progress bar should go from brown to glowing yellow as level increases

				// determine active loop section
				if (user_ps.current_ps_finished) {
					res.to_template.new_ps_active = true;
				} else {
					res.to_template.submit_ps_active = true;
				}
				//grading_ps_active // future tech when sockets and hook are implemented. Give them something to do
				// while grading


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


question_example =
{
	"concept": "algos1",
	"type": "2",
	"variant": 42,
	"instruction_text": "Write a method that takes an ArrayList of Integers as its only parameter and outputs the " +
	"average of all the values as a double",
	"cards": []
};

function get_random_question(concept, type, questions_list) {
	console.log(concept);
	console.log(type);
	console.log(typeof concept);
	console.log(typeof type);
	return collection_questions.find({"concept": concept, "type": type}, function (err, questions) {
		var question = questions[Math.floor(Math.random() * questions.length)];
		questions_list.push(question);
		console.log(question);
	});

	//return {
	//	"concept": "algos1",
	//	"type": 2,
	//	"variant": 42,
	//	"instruction_text": "Write a method that takes an ArrayList of Integers as its only parameter and outputs the " +
	//	"average of all the values as a double: " + random_section_id(),
	//	"cards": []
	//};

}


var xp_example = {
	"variables": {"1": 0, "2": 1, "3": 0, "4": 0, "5": 0},
	"methods": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
	"data_structures": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
	"algorithms": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
	// ...
};

function generate_new_ps(req, res, user_ps, next) {

	console.log(user_ps);
	var new_ps_number = user_ps.current_ps.ps_number + 1;
	var previous_generation_time = user_ps.current_ps.time_generated;
	var ms_in_day = 1000 * 60 * 60 * 24;

	var point_value = 100.0;
	var multipliers = [];
	if (Math.floor(Date.now() / ms_in_day) !== Math.floor(previous_generation_time / ms_in_day)) {
		multipliers.push({"reason": "First Problem Set of the Day", "multiplier": 1.5});
		point_value *= 1.5;
	}
	var ps =
	{
		'assigned_username': req.user.username,
		'ps_number': new_ps_number,
		//'concept': current_concept,
		//'submitted': false,
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
			//all_ps_assigned: {}
		};

		toSet['all_ps_assigned.' + new_ps_number] = ps;
		user_ps.current_ps = ps;

		console.log("toSet");
		console.log(toSet);

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
	res.send(build_ps_text(ps));
}

exports.ps_download = function ps_download(req, res, course) {
	console.log("ps_download");
	console.log(req.user.username);

	if (!req.user) {
		res.render('questions/ps', res.to_template);
	} else {
		collection_ps.findOne({"username": req.user.username}, {}, function (err, user_ps) {
			if (err) {
				console.log("database error in ps_download: " + err);
				req.flash("error", "Database error 1");
				res.render('questions/ps', res.to_template);
			} else if (!user_ps) {
				console.log("user not enrolled for problem sets: " + req.user.username);
				req.flash("error", "User " + req.user.username + " is not registered for this feature. If you are enrolled in CSE115 send and email to hartloff@buffalo.edu with the subject \"CSE115 Problem Set Registration\" immediately to unlock problem sets");
				res.render('questions/ps', res.to_template);
			} else {
				if (user_ps.current_ps_finished) {
					//send_current_ps(req, res, user_ps);
					generate_new_ps(req, res, user_ps, send_current_ps);
				} else {
					send_current_ps(req, res, user_ps);
				}
			}
		});
	}

};


exports.ps_api = function ps_api(req, res, course) {
	if (req.body.key !== "super_secret_key") {
		// TODO: better keys
		res.send("You can't use this API");
	} else if (!req.get('User-Agent')) {
		// TODO
		res.send("You can't use this API");
	} else if (req.body.request_type === "get_current_ps") {
		api_get_current_ps(req, res, course);
	} else if (req.body.request_type === "send_ps_results") {
		api_send_ps_results(req, res, course);
	} else {
		res.send("bad request type: " + req.body.request_type);
	}
};

function api_get_current_ps(req, res, course) {
	var section_id = req.body.section_id;

	collection_ps.findOne({"section_id": section_id}, {}, function (err, record) {
		if (err) {
			console.log("database error in api_get_current_ps: " + err);
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
			res.send("database error");
		} else if (!record) {
			res.send("No user found with section_id " + section_id);
		} else if (record.current_ps_finished) {
			console.log("Resubmission for no credit. section_id=" + section_id + " problem set=" + record.current_ps.ps_number);
			// TODO: ~Mark some feedback to show this no credit submission to the user with a note
			res.send("This problem set has already been submitted for credit. This submission will not count towards course progress.");
		} else {

			var xp = record.xp;
			var number_correct = 0;

			for (var i in results) {
				var result = results[i];
				var question = record.current_ps.questions[i];
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

			// Tally up total xp
			var multiplier = 100.0;
			for (var i = 0; i < record.current_ps.multipliers.length; i++) {
				multiplier *= record.current_ps.multipliers[i].multiplier;
			}
			var total_xp = record.total_xp + number_correct * multiplier;

			// Check for level up
			var level_up = false;
			var new_level = record.level;
			if (total_xp >= level_requirements.get_level_requirements(record.level).xp_for_next_level) {
				level_up = true;
				new_level++;
			}

			var toSet = {};
			toSet["current_ps_finished"] = true;
			toSet["all_ps_assigned." + record.current_ps.ps_number + ".results"] = results;
			toSet["all_ps_assigned." + record.current_ps.ps_number + ".time_completed"] = Date.now();
			toSet["xp"] = xp;
			toSet["total_xp"] = total_xp;
			if (level_up) {
				toSet["level"] = new_level;
				toSet["leveled_up"] = true;
			}

			collection_ps.update({"section_id": section_id}, {$set: toSet}, function (err) {
				if (err) {
					console.log("database error in api_get_current_ps update: " + err);
					res.send("database error");
				} else {
					res.send("Results sent to course site");
				}
			});

		}
	});


// Send PS results and feedback by section_id

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
				'homework': {}
			};
			collection_ps.insert(collection_entry_example, next());
		}
	});
}

function random_section_id(token_length) {
	var length = token_length || 10;
	var alphabet = '012356789';
	var token = '';
	for (var i = 0; i < length; i++) {
		token += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	return token;
}
// function set_user_section_id(username, section_id){}

// function set_user_lab_section(username, lab_section){}
// function set_user_number_id(username, section_id){}

//add_ps_user("sophie", "A1", "11111111", "1234567890", function(){console.log("user added");});
