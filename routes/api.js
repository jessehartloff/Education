var express = require('express');
var router = express.Router();

var request = require('request');

router.get('/cse115', function (req, res) {

	var userAgent = req.get('User-Agent');
	console.log(userAgent);
	var question = req.query["question"];

	if(userAgent.indexOf("Java") == -1){
		res.send("You must use Java to connect to this api");
	}
	else if(!question){
		res.send('question parameter not found in query string');
	}
	else if(question === "q1"){
		res.send("77");
	}
	else if(question === "q2"){
		res.send("163");
	}else{
		res.send("Not a valid question");
	}

//https://fury.cse.buffalo.edu/api/cse115?question=q2

});


function clean_url(url){
	return url.split('{')[0];
}

module.exports = router;