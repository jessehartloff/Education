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
		"level_name": "Computing Introduction",
		"xp_for_next_level": 2000,
		"question_targets": [
			{"concept": "variables", "type": "1", "cumulative_number_correct": 3}, // print String
			{"concept": "variables", "type": "2", "cumulative_number_correct": 2}, // print int/double
			{"concept": "variables", "type": "3", "cumulative_number_correct": 0}, // line
			{"concept": "variables", "type": "4", "cumulative_number_correct": 0}, // concatenate
			{"concept": "variables", "type": "5", "cumulative_number_correct": 0}  // parabola
		]
	};
}

function level2() {
	return {
		"level_name": "Computing with Methods",
		"xp_for_next_level": 4000,
		"question_targets": [
			{"concept": "methods", "type": "1", "cumulative_number_correct": 2}, // random math functions (double, double) -> double
			{"concept": "methods", "type": "2", "cumulative_number_correct": 2}, // to upper/lower then replace char
			{"concept": "methods", "type": "3", "cumulative_number_correct": 1}, // length after removing 3 chars
			{"concept": "methods", "type": "4", "cumulative_number_correct": 0}, // total number of 2 chars
			{"concept": "methods", "type": "5", "cumulative_number_correct": 0}  // distance between points
		].concat(level1().question_targets)
	};
}

function level3() {
	return {
		"level_name": "Handling Data",
		"xp_for_next_level": 6000,
		"question_targets": [
			{"concept": "data_structures", "type": "1", "cumulative_number_correct": 2}, // make an ArrayList
			{"concept": "data_structures", "type": "2", "cumulative_number_correct": 2}, // make a HashMap
			{"concept": "data_structures", "type": "3", "cumulative_number_correct": 1}, // sum of fixed indices in list of ints
			{"concept": "data_structures", "type": "4", "cumulative_number_correct": 0}, // HashMap iteration w/ String concatenate
			{"concept": "data_structures", "type": "5", "cumulative_number_correct": 0}  // Iterate over ArrayList<String/int/double> and do a bunch of math/aggregate
			   																		     // TODO: This one sucks. solid idea, needs to be adjusted. See java code (previous 2 are also not great)
		].concat(level2().question_targets)
	};
}

function level4() {
	return {
		"level_name": "Controlling Code",
		"xp_for_next_level": 8000,
		"question_targets": [
			{"concept": "control_flow", "type": "1", "cumulative_number_correct": 2}, // boolean expression
			{"concept": "control_flow", "type": "2", "cumulative_number_correct": 2}, // print int range
			{"concept": "control_flow", "type": "3", "cumulative_number_correct": 1}, // if/else w/ String length/contains
			{"concept": "control_flow", "type": "4", "cumulative_number_correct": 0}, // populate HashMap with range -> math(range)
			{"concept": "control_flow", "type": "5", "cumulative_number_correct": 0}  // filter ArrayList by math(value) with range
		].concat(level3().question_targets)
	};
}

function level5() {
	return {
		"level_name": "Analyzing Data",
		"xp_for_next_level": 10000,
		"question_targets": [
			{"concept": "algorithms", "type": "1", "cumulative_number_correct": 2}, // sig value (return value)
			{"concept": "algorithms", "type": "2", "cumulative_number_correct": 2}, // find first
			{"concept": "algorithms", "type": "3", "cumulative_number_correct": 1}, // closest to <double>
			{"concept": "algorithms", "type": "4", "cumulative_number_correct": 0}, // sig value (return index/key)
			{"concept": "algorithms", "type": "5", "cumulative_number_correct": 0}  // sig value (return tie count)
		].concat(level4().question_targets)
	};
}


function level6() {
	return {
		"level_name": "Data on Files",
		"xp_for_next_level": 12000,
		"question_targets": [
			{"concept": "files", "type": "1", "cumulative_number_correct": 2},
			{"concept": "files", "type": "2", "cumulative_number_correct": 2},
			{"concept": "files", "type": "3", "cumulative_number_correct": 1},
			{"concept": "files", "type": "4", "cumulative_number_correct": 0},
			{"concept": "files", "type": "5", "cumulative_number_correct": 0}
		].concat(level5().question_targets)
	};
}



function level7() {
	return {
		"level_name": "Objects and Classes",
		"xp_for_next_level": 14000,
		"question_targets": [
			{"concept": "classes", "type": "1", "cumulative_number_correct": 2},
			{"concept": "classes", "type": "2", "cumulative_number_correct": 2},
			{"concept": "classes", "type": "3", "cumulative_number_correct": 1},
			{"concept": "classes", "type": "4", "cumulative_number_correct": 0},
			{"concept": "classes", "type": "5", "cumulative_number_correct": 0}
		].concat(level6().question_targets)
	};
}



function level8() {
	return {
		"level_name": "Getting Graphical",
		"xp_for_next_level": 16000,
		"question_targets": [
			{"concept": "gui", "type": "1", "cumulative_number_correct": 2},
			{"concept": "gui", "type": "2", "cumulative_number_correct": 2},
			{"concept": "gui", "type": "3", "cumulative_number_correct": 1},
			{"concept": "gui", "type": "4", "cumulative_number_correct": 0},
			{"concept": "gui", "type": "5", "cumulative_number_correct": 0}
		].concat(level7().question_targets)
	};
}



function level9() {
	return {
		"level_name": "Extending Classes",
		"xp_for_next_level": 18000,
		"question_targets": [
			{"concept": "inheritance", "type": "1", "cumulative_number_correct": 2},
			{"concept": "inheritance", "type": "2", "cumulative_number_correct": 2},
			{"concept": "inheritance", "type": "3", "cumulative_number_correct": 1},
			{"concept": "inheritance", "type": "4", "cumulative_number_correct": 0},
			{"concept": "inheritance", "type": "5", "cumulative_number_correct": 0}
		].concat(level8().question_targets)
	};
}



function level10() {
	return {
		"level_name": "Polymorphism",
		"xp_for_next_level": 20000,
		"question_targets": [
			{"concept": "polymorphism", "type": "1", "cumulative_number_correct": 2},
			{"concept": "polymorphism", "type": "2", "cumulative_number_correct": 2},
			{"concept": "polymorphism", "type": "3", "cumulative_number_correct": 1},
			{"concept": "polymorphism", "type": "4", "cumulative_number_correct": 0},
			{"concept": "polymorphism", "type": "5", "cumulative_number_correct": 0}
		].concat(level9().question_targets)
	};
}



function level11() {
	return {
		"level_name": "The Internet",
		"xp_for_next_level": 22000,
		"question_targets": [
			{"concept": "networking", "type": "1", "cumulative_number_correct": 2},
			{"concept": "networking", "type": "2", "cumulative_number_correct": 2},
			{"concept": "networking", "type": "3", "cumulative_number_correct": 1},
			{"concept": "networking", "type": "4", "cumulative_number_correct": 0},
			{"concept": "networking", "type": "5", "cumulative_number_correct": 0}
		].concat(level10().question_targets)
	};
}



function level12() {
	return {
		"level_name": "The Language of the Internet",
		"xp_for_next_level": 24000,
		"question_targets": [
			{"concept": "json", "type": "1", "cumulative_number_correct": 2},
			{"concept": "json", "type": "2", "cumulative_number_correct": 2},
			{"concept": "json", "type": "3", "cumulative_number_correct": 1},
			{"concept": "json", "type": "4", "cumulative_number_correct": 0},
			{"concept": "json", "type": "5", "cumulative_number_correct": 0}
		].concat(level11().question_targets)
	};
}



function level13() {
	return {
		"level_name": "The Gauntlet",
		"xp_for_next_level": 30000,
		"question_targets": level12().question_targets
	};
}



function level14() {
	return {
		"level_name": "The Final Challenge",
		"xp_for_next_level": 32000,
		"question_targets": [
			{"concept": "challenge", "type": "1", "cumulative_number_correct": 1},
			{"concept": "challenge", "type": "2", "cumulative_number_correct": 1},
			{"concept": "challenge", "type": "3", "cumulative_number_correct": 1},
			{"concept": "challenge", "type": "4", "cumulative_number_correct": 1},
			{"concept": "challenge", "type": "5", "cumulative_number_correct": 1}
		].concat(level13().question_targets)
	};
}



function level15() {
	return {
		"level_name": "End Game",
		"xp_for_next_level": 99999,
		"question_targets": [
			//{"concept": "ssj", "type": "1", "cumulative_number_correct": 1},
			//{"concept": "ssj", "type": "2", "cumulative_number_correct": 1},
			//{"concept": "ssj", "type": "3", "cumulative_number_correct": 1},
			//{"concept": "ssj", "type": "4", "cumulative_number_correct": 1},
			//{"concept": "ssj", "type": "5", "cumulative_number_correct": 1}
		].concat(level14().question_targets)
	};
}

function level16() {
	return {
		"level_name": "null",
		"xp_for_next_level": 999999,
		"question_targets": [
			//{"concept": "ssj", "type": "1", "cumulative_number_correct": 1},
			//{"concept": "ssj", "type": "2", "cumulative_number_correct": 1},
			//{"concept": "ssj", "type": "3", "cumulative_number_correct": 1},
			//{"concept": "ssj", "type": "4", "cumulative_number_correct": 1},
			//{"concept": "ssj", "type": "5", "cumulative_number_correct": 1}
		].concat(level15().question_targets)
	};
}
