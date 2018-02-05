exports.doubles = function doubles(expected, output) {
	if (typeof expected != "number") {
		expected = parseFloat(expected);
		if (isNaN(expected)) {
			console.log("error: Bad expected value while comparing doubles");
			return true; // If the expected value is bad, give the student a free one
		}
	}
	output = parseFloat(output);
	if (isNaN(output)) {
		return false;
	} else {
		return Math.abs(expected - output) < 0.01;
	}
};

exports.integers = function (expected, output) {
	if (typeof expected != "number") {
		expected = parseInt(parseFloat(expected) + 0.1); // just so 3.99999 will be a 4 (shouldn't happen, but why not)
		if (isNaN(expected)) {
			console.log("error: Bad expected value while comparing integers");
			return true; // If the expected value is bad, give the student a free one
		}
	}
	output = parseInt(parseFloat(output) + 0.1); // just so 3.99999 will be a 4 (shouldn't happen, but why not)
	if (isNaN(output)) {
		return false;
	} else {
		return expected == output;
	}
};

exports.strings = function (expected, output) {
	if (typeof expected != "string") {
		expected = expected.toString();
		if (expected != "" && !expected) {
			console.log("error: Bad expected value while comparing strings");
			return true; // If the expected value is bad, give the student a free one
		}
	}
	if (typeof output != "string") {
		output = output.toString();
		if (output != "" && !output) {
			return false;
		}
	}
	return expected.trim() == output.trim();
};



//console.log(exports.strings("\t \t \t hello world\n\n", "  hello world    "));
//console.log(exports.strings("hello worlds", "hello world"));
//console.log(exports.strings("", "hello world"));
//console.log(exports.strings("hello world", ""));
//console.log(exports.strings(6, 6.0));

//console.log(exports.integers(4, " 4.0 "));
//console.log(exports.integers("4", " 3.99999 "));
//console.log(exports.integers(4.0+"few", "abcd"));
//console.log(exports.integers(" 0.0", "00"));
//console.log(exports.integers(4.0, "4..4"));
//console.log(exports.integers("abcd", "4..4"));
//console.log(exports.integers("4", "4.1"));
//console.log(exports.integers("4", "4.8"));


//console.log(exports.doubles(4.0, " 8.0 "));
//console.log(exports.doubles(4.0000001, " 3.99999 "));
//console.log(exports.doubles(4.0+"few", "abcd"));
//console.log(exports.doubles(" 0.0", "00"));
//console.log(exports.doubles(4.0, "4..4"));
//console.log(exports.doubles("abcd", "4..4"));
