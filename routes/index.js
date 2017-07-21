var express = require('express');
var router = express.Router();


router.get('/', function (req, res) {
	res.redirect('/courses');
	//res.render('index', {
	//	'course_list': res.course_list
	//});
});



module.exports = router;
