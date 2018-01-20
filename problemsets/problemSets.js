var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var users = require('../util/users');
var collection_ps = db.get('ps');
var collection_questions = db.get('questions');

var current_course = 'cse115-s18';

var collection_entry_example =
{
	'username': 'hartloff',
	'lab_section': 'B3',
	'id': 1232313123, // For card swipe
	'section_id': 123455, // Unique id matching AutoLab section
	'current_ps': {},
	'current_ps_finished': false,
	'all_ps_assigned': {}, // keyed by ps_number
	//'all_ps_results': {}, // keyed by ps_number

	'levels': {},
	'xp': {},
	'lab_stuff': "? we'll get there. Worst case, manually checked/verified. Maybe only checked on card swipe.."
};

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
				res.to_template.current_problem_set_number = user_ps.current_ps.ps_number;
				// TODO: grab feedback, result, XP, level, progress to next lab/homework
				res.render('questions/ps', res.to_template);
			}
		});
	}
};


question_example =
{
	"concept": "algos1",
	"type": 2,
	"variant": 42,
	"instruction_text": "Write a method that takes an ArrayList of Integers as its only parameter and outputs the " +
	"average of all the values as a double",
	"cards": []
};

function get_random_question(concept, type, questions_list) {
	return collection_questions.find({"concept": concept, "type": type}, function (err, questions) {
		var question = questions[Math.floor(Math.random() * questions.length)];
		questions_list.push(question);
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

var level_requirements = {
	"1": []
};

function get_level_requirements(current_level) {
	switch (current_level) {
		case 1:
			return {
				"xp_for_next_level": 1000,
				"question_targets": [
					{
						"concept": "variables",
						"type": 1,
						"cumulative_number_correct": 4
					},
					{
						"concept": "variables",
						"type": 2,
						"cumulative_number_correct": 4
					},
					{
						"concept": "variables",
						"type": 3,
						"cumulative_number_correct": 4
					},
					{
						"concept": "variables",
						"type": 4,
						"cumulative_number_correct": 2
					},
					{
						"concept": "variables",
						"type": 5,
						"cumulative_number_correct": 2
					}
				]
			};
		case 2:
			return;
		default:
			return {};
	}
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
	//var current_concept = "algos2";
	//var question_types_remaining = [2, 3, 4, 5];
	var bonus_multiplier = 1;
	var ps =
	{
		'assigned_username': req.user.username,
		'ps_number': new_ps_number,
		//'concept': current_concept,
		//'submitted': false,
		'multiplier': bonus_multiplier,
		'time_generated': Date.now(),
		'time_completed': 0
	};

	ps['class_name'] = java_class_name(ps);

	var number_of_questions = 5;

	var question_types = [];

	var level_requirements = get_level_requirements(1); // TODO get level
	var player_xp = user_ps.xp;
	var questions_needed = [];
	for (var index = 0; index < level_requirements.question_targets.length; index++) {
		var requirement = level_requirements.question_targets[index];

		//{
		//	"xp_for_next_level":100,
		//	"question_targets": [
		//	{
		//		"concept": "variables",
		//		"type": 1,
		//		"cumulative_number_correct": 4
		//	},
		//	{
		//		"concept": "variables",
		//		"type": 2,
		//		"cumulative_number_correct": 4
		//	},
		//	{
		//		"concept": "variables",
		//		"type": 3,
		//		"cumulative_number_correct": 4
		//	},
		//	{
		//		"concept": "variables",
		//		"type": 4,
		//		"cumulative_number_correct": 2
		//	},
		//	{
		//		"concept": "variables",
		//		"type": 5,
		//		"cumulative_number_correct": 2
		//	}
		//]
		//}

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

	//questions_needed.sort(function(a,b){
	//	return b.priority - a.priority;
	//});

	console.log(questions_needed);

	// TODO choose from questions remaining while favoring early ones. Watch for questions_needed < 5

	for (var i = 0; i < number_of_questions; i++) {
		var highest_priority_value = Number.MIN_VALUE;
		var highest_priority_index = -1;
		var highest_priority_question = {"concept": "variables", "type": 1};
		for (var j = 0; j < questions_needed.length; j++) {
			if(questions_needed[j].priority > highest_priority_value){
				highest_priority_value = questions_needed[j].priority;
				highest_priority_index = j;
				highest_priority_question = questions_needed[j];
			}
		}
		if(highest_priority_index === -1){
			// bad
		}else {
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

//exports.ps_download_new = function ps_download_new(req, res, course) {
//	// TODO: Do not allow unless current PS has been graded! Must complete a gameplay loop before starting the next one
//	// TODO generate new PS
//	res.setHeader('Content-disposition', 'attachment; filename=ProblemSet_hartloff_0001.java');
//	console.log(__dirname);
//	res.send("\npublic class ProblemSet_hartloff_0001{\n\n\tpublic static void main(String[] args){\n\t\tSystem.out.println(\"Hello world!\");\n\t}\n}\n\n");
//};
//
//exports.ps_download_current = function ps_download_current(req, res, course) {
//	// TODO: build and send current PS
//	res.setHeader('Content-disposition', 'attachment; filename=ProblemSet_hartloff_0001.java');
//	console.log(__dirname);
//	res.send("\npublic class ProblemSet_hartloff_0001{\n\n\tpublic static void main(String[] args){\n\t\tSystem.out.println(\"Hello world!\");\n\t}\n}\n\n");
//};

exports.ps_api = function ps_api(req, res, course) {
	if (req.body.key !== "super_secret_key") {
		// TODO: better keys
		res.send("nope");
	} else if (!req.get('User-Agent')) {
		// TODO
		res.send("nah");
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
			// TODO: Mark some feedback to show this no credit submission to the user with a note
			res.send("This problem set has already been submitted for credit. This submission will not count towards course progress.");
		} else {

			var xp = record.xp;

			for (var i in results) {
				//var question_number = i + 1;
				var result = results[i];
				var question = record.current_ps.questions[i];
				if (result.correct) {
					if (!xp[question.concept]) {
						xp[question.concept] = {};
					}
					if (!xp[question.concept][question.type.toString()]) {
						xp[question.concept][question.type.toString()] = 0;
					}
					xp[question.concept][question.type.toString()] += record.current_ps.multiplier;
				}
			}

			// TODO
			// database error in api_send_ps_results: TypeError: Cannot read property '1' of undefined

			var toSet = {};
			toSet["current_ps_finished"] = true;
			toSet["all_ps_assigned." + record.current_ps.ps_number + ".results"] = results;
			toSet["all_ps_assigned." + record.current_ps.ps_number + ".time_completed"] = Date.now();
			toSet["xp"] = xp;

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
				'current_ps': {
					'assigned_username': username,
					'ps_number': 0,
					'concept': 'null',
					//'submitted': true,
					'questions': [
						//{},{},{},{},{}
					]
				},
				'current_ps_finished': true,
				'all_ps_assigned': {}, // keyed by ps_number
				'all_ps_results': {}, // keyed by ps_number

				'levels': {},
				'xp': {},
				'labs': {},
				'homework': {},
				'extra': {},
				'extra_text': ""
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

//console.log(Date.now());
var f = {
	"assigned_username": "sophie",
	"ps_number": 6,
	"bonus_multiplier": 1,
	"time_generated": 1516251363210,
	"time_completed": 0,
	"class_name": "ProblemSet_sophie_0006",
	"questions": [{
		"_id": "5a5fc896241e006889983c25",
		"concept": "variables",
		"type": 1,
		"variant": 7,
		"instruction_text": "Print \"hey planet\" to the screen",
		"cards": []
	}, {
		"_id": "5a5fc896241e006889983c28",
		"concept": "variables",
		"type": 1,
		"variant": 10,
		"instruction_text": "Print \"hello planet\" to the screen",
		"cards": []
	}, {
		"_id": "5a5fc896241e006889983c1f",
		"concept": "variables",
		"type": 1,
		"variant": 1,
		"instruction_text": "Print \"hello world\" to the screen",
		"cards": []
	}, {
		"_id": "5a5fc896241e006889983c1f",
		"concept": "variables",
		"type": 1,
		"variant": 1,
		"instruction_text": "Print \"hello world\" to the screen",
		"cards": []
	}, {
		"_id": "5a5fc896241e006889983c27",
		"concept": "variables",
		"type": 1,
		"variant": 9,
		"instruction_text": "Print \"sup planet\" to the screen",
		"cards": []
	}]
};

