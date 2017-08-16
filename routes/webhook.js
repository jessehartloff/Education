var express = require('express');
var router = express.Router();
var users_util = require('../util/users');
var course_util = require('../util/course');
var projects_util = require('../util/projects');
var api_util = require('../util/api');


// TODO: Update project data on repo events. Confirm on their project page when the first ping is received


router.get('/', function (req, res) {
	console.log(req.body);
	res.send('ACK');
});

router.post('/', function (req, res) {
	console.log(req.body);
	console.log(req.headers['X-GitHub-Event']);
	//console.log(req.body.payload.repository);
	//console.log(req.body.payload.repository.html_url);
	res.send('ACK');
});


module.exports = router;