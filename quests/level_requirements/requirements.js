exports.get_level_requirements = function get_level_requirements(current_level) {
	switch (current_level) {
		case 1:
			return level1();
		case 2:
			return level2();
		case 3:
			return level3();
		case 4:
			return level4();
		case 5:
			return level5();
		case 6:
			return level6();
		case 7:
			return level7();
		case 8:
			return level8();
		case 9:
			return level9();
		case 10:
			return level10();
		case 11:
			return level11();
		case 12:
			return level12();
		case 13:
			return level13();
		case 14:
			return level14();
		case 15:
			return level15();
		case 16:
			return level16();
		default:
			return level16();
	}
};


function level1() {
	return {
		"level_name": "Computing with Variables",
		"xp_for_next_level": 2500,
		"question_targets": [
			{"concept": "variables", "type": "1", "cumulative_number_correct": 5},
			{"concept": "variables", "type": "2", "cumulative_number_correct": 4},
			{"concept": "variables", "type": "3", "cumulative_number_correct": 3},
			{"concept": "variables", "type": "4", "cumulative_number_correct": 2},
			{"concept": "variables", "type": "5", "cumulative_number_correct": 2}
		]
	};
}

function level2() {
	return {
		"level_name": "Computing with Methods",
		"xp_for_next_level": 5000,
		"question_targets": [
			{"concept": "methods", "type": "1", "cumulative_number_correct": 4},
			{"concept": "methods", "type": "2", "cumulative_number_correct": 4},
			{"concept": "methods", "type": "3", "cumulative_number_correct": 4},
			{"concept": "methods", "type": "4", "cumulative_number_correct": 3},
			{"concept": "methods", "type": "5", "cumulative_number_correct": 2}
		].concat(level1().question_targets)
	};
}

function level3() {
	return {
		"level_name": "Handling Data",
		"xp_for_next_level": 7500,
		"question_targets": [
			{"concept": "data_structures", "type": "1", "cumulative_number_correct": 5},
			{"concept": "data_structures", "type": "2", "cumulative_number_correct": 5},
			{"concept": "data_structures", "type": "3", "cumulative_number_correct": 3},
			{"concept": "data_structures", "type": "4", "cumulative_number_correct": 3},
			{"concept": "data_structures", "type": "5", "cumulative_number_correct": 2}
		].concat(level2().question_targets)
	};
}

function level4() {
	return {
		"level_name": "Controlling Code",
		"xp_for_next_level": 10000,
		"question_targets": [
			{"concept": "control_flow", "type": "1", "cumulative_number_correct": 5},
			{"concept": "control_flow", "type": "2", "cumulative_number_correct": 4},
			{"concept": "control_flow", "type": "3", "cumulative_number_correct": 3},
			{"concept": "control_flow", "type": "4", "cumulative_number_correct": 2},
			{"concept": "control_flow", "type": "5", "cumulative_number_correct": 2}
		].concat(level3().question_targets)
	};
}

function level5() {
	return {
		"level_name": "Analyzing Data",
		"xp_for_next_level": 10000,
		"question_targets": [
			{"concept": "methods", "type": "1", "cumulative_number_correct": 5},
			{"concept": "methods", "type": "2", "cumulative_number_correct": 4},
			{"concept": "methods", "type": "3", "cumulative_number_correct": 3},
			{"concept": "methods", "type": "4", "cumulative_number_correct": 2},
			{"concept": "methods", "type": "5", "cumulative_number_correct": 2}
		].concat(level4().question_targets)
	};
}



function level15() {
	return {
		"level_name": "End Game",
		"xp_for_next_level": 999999,
		"question_targets": [
			{"concept": "methods", "type": "1", "cumulative_number_correct": 5},
			{"concept": "methods", "type": "2", "cumulative_number_correct": 4},
			{"concept": "methods", "type": "3", "cumulative_number_correct": 3},
			{"concept": "methods", "type": "4", "cumulative_number_correct": 2},
			{"concept": "methods", "type": "5", "cumulative_number_correct": 2}
		].concat(level1().question_targets)
	};
}

function level16() {
	return {
		"level_name": "null",
		"xp_for_next_level": 9999999,
		"question_targets": [
			{"concept": "methods", "type": "1", "cumulative_number_correct": 5},
			{"concept": "methods", "type": "2", "cumulative_number_correct": 4},
			{"concept": "methods", "type": "3", "cumulative_number_correct": 3},
			{"concept": "methods", "type": "4", "cumulative_number_correct": 2},
			{"concept": "methods", "type": "5", "cumulative_number_correct": 2}
		].concat(level1().question_targets)
	};
}

// TODO add more end game levels. Can be the same questions, but it's fun to see the xp bar fill up