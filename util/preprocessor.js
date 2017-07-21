var express = require('express');
var app = express();

app.use(function (req, res, next) {

	var collection = req.db.get('course_list');
	collection.find({},{}, function(err, data){
		if(!res.to_template) {
			res.to_template = {};
		}
		res.to_template.course_list = data;
		next();
	});

});

//// Check if a user is logged in
//app.use(function (req, res, next) {
//	console.log(req.user);
//	if(req.user) {
//		res.to_template.user = {'username': req.user.username};
//	}
//	next();
//	//if (req.user) {
//	//	next();
//	//} else {
//	//	res.redirect('/');
//	//}
//});

module.exports = app;
