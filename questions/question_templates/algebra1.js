exports.generate_question = function generate_question(question_params) {
	var difficulty = question_params.difficulty;

	var scale = 50;

	var a = Math.floor(Math.random() * difficulty * scale);
	var b = Math.floor(Math.random() * difficulty * scale);

	var answer = b - a;

	var question_text = a + " + x = " + b;
	var grader_params = {"answer": answer};

	// {"question_text": "3 + x = 2", "grader_params": {"answer": 5}}
	return {"question_text": question_text, "grader_params": grader_params};
};


exports.grade_question = function grade_question(grader_params, student_answer) {
	var answer = grader_params.answer;
	if(answer === parseInt(student_answer)){
		return {"correct": true, "text": "Great job!"};
	}else{
		var feedback = "The answer was " + answer;
		return {"correct": false, "text": feedback};
	}
};

