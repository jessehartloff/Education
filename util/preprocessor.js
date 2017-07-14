var express = require('express');
var router = express.Router();

router.use(function (req, res, next) {

	var collection = req.db.get('course_list');
	collection.find({},{}, function(err, data){
		res.course_list = data;
		next();
	});

});

module.exports = router;
