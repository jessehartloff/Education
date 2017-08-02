var express = require('express');
var app = express();
var router = express.Router();

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var nodemailer = require('nodemailer');

var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');


var collection = db.get('users');

app.use(session({
	secret: 'it\'s a secret to everybody.', // not really. It's in a public repo
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.username);
});

passport.deserializeUser(function (user, done) {
	collection.findOne({username: user}, {_id: 0, password: 0}, function (err, user) {
		if (err) {
			return done(err);
		} else {
			done(null, user);
		}
	})
});

function local_strategy_function(username, password, done) {
	collection.findOne({username: username}, {_id: 0}, function (err, user) {
		if (err) {
			return done(err);
		}
		if (!user) {
			return done(null, false, {message: 'Invalid username.'});
		}
		if (!bcrypt.compareSync(password, user.password)) {
			return done(null, false, {message: 'Incorrect password.'});
		}
		delete user.password;
		return done(null, user);
	});
}

passport.use(new LocalStrategy(local_strategy_function));


// Check if a user is logged in
app.use(function (req, res, next) {
	console.log(req.user);
	if (req.user) {
		//res.to_template.user = {'username': req.user.username};
		res.to_template.user = req.user;
	}
	next();
});

router.get('/profile', function (req, res, next) {
	//console.log(res.to_template);
	res.render('user', res.to_template);
});


router.get('/login', function (req, res, next) {
	res.render('login', res.to_template);
});

router.post('/login', function (req, res, next) {
	passport.authenticate('local', {
		successRedirect: '/user/profile',
		failureRedirect: '/user/login',
		failureFlash: true
	})(req, res, next);
});


router.post('/register', function (req, res, next) {
	if (req.body.email) {
		var email = req.body.email.trim().toLowerCase();
		if (email.endsWith('@buffalo.edu')) {
			var username = email_to_ubit(email);
			// TODO: Let them choose their first password. Why give them a random one that they won't change?
			// TODO: Let them choose their display name right away as well.. maybe later.
			//       If they change their name should it update previous posts? I think yes.. or no
			add_user(username);
			res.to_template.message = "An account has been created for you and a temporary password has been sent " +
				"to your email";
			// TODO: a different message for any errors including registering an existing user
			res.render('login', res.to_template);
			return;
		}
	}
	req.flash('error', 'enter your @buffalo.edu email address to register');
	res.render('login', res.to_template);
});


router.get('/forgot-password', function (req, res, next) {
	res.render('forgot_password', res.to_template);
});

router.post('/forgot-password', function (req, res, next) {
	if (req.body.email) {
		var email = req.body.email.trim().toLowerCase();
		if (email.endsWith('@buffalo.edu')) {
			var username = email_to_ubit(email);
			var temp_password = random_temp_password();
			// TODO: Check if user exists
			change_password(username, temp_password);
			email_temp_password(username + "@buffalo.edu", temp_password);
			res.to_template.message = "A temporary password has been sent to your email";
			// TODO: some sort of auth to prevent pranks. person number perhaps? (email a link with token)
			res.render('login', res.to_template);
			return;
		}
	}
	res.to_template.message = "enter your @buffalo.edu email address";
	res.render('login', res.to_template);
});


router.get('/logout', function (req, res) {
	if (req.user) {
		console.log('user ' + req.user.username + ' logged out');
		req.logout();
		req.flash('success', 'logged out');
		//res.redirect('/');
	} else {
		// not logged in
		//res.redirect('/');
		req.flash('info', 'already logged out');
		//console.log('not logged in');
	}
	res.redirect('/user/login');
});

router.post('/change-password', function (req, res) {
	if (req.user && req.body.old_password && req.body.new_password_1 && req.body.new_password_2) {
		local_strategy_function(req.user.username, req.body.old_password, function (err, user, options) {
			// TODO: Check for password strength
			// TODO: Check for weird chars
			if (options && options.message) {
				req.flash('error', options.message);
			}
			if (err) {
				//res.render('error', options)
			} else if (!user) {
				//res.render('error', options)
			} else if (user.username === req.user.username) {
				// authenticated
				if (req.body.new_password_1 !== req.body.new_password_2) {
					req.flash('error', 'new passwords do not match');
				} else {
					var magic_eight_ball = 8;
					if (req.body.new_password_1.length < magic_eight_ball) {
						req.flash('info', 'password must contain at least ' + magic_eight_ball + ' characters');
					} else {
						change_password(user.username, req.body.new_password_1);
						req.flash('success', 'password updated');
					}
				}
			}
			//res.render('user', res.to_template);
			res.redirect('/user/profile');
		});
	} else {
		req.flash('error', 'could not change password');
		//res.render('user', res.to_template);
		res.redirect('/user/profile');
	}
});


router.post('/update-course-options/:course', function (req, res) {
	var course_collection = req.db.get("course_content");
	var course = req.params.course;
	//if(course req.user.courses_enrolled;
	for (var i in req.user.courses_enrolled) {
		var this_course = req.user.courses_enrolled[i];
		if (this_course.course_key === course) {
			//course_collection.find({'course': course}, function(err, record){
			// TODO: If err; if not record
			for (var option_key in this_course.options) {
				console.log('updating ' + option_key);
				//var this_option = this_course.options[option_key];
				var new_value = req.body[option_key]; // TODO: Error check
				req.user.courses_enrolled[course].options[option_key].value = new_value;

				var set_string = 'courses_enrolled.' + course + '.options.' + option_key + '.value';
				var to_set = {$set: {}};
				to_set.$set[set_string] = new_value;

				collection.update({'username': req.user.username}, to_set);
			}
			//});

		}
	}

	res.redirect('/user/profile');
});


app.use('/user', router);
module.exports = app;


///// Utils


//function enroll_in_course(username, course) {
//	// TODO: Add course
//	// TODO: Add different options based on course
//
//	// pull course from database
//	// iterate over student options and add them to the student under the course name
//}
//
//function change_data(username, course, data_name, new_value) {
//	//collection.updateOne({'username': username}, {$set: {data_name: new_value}});
//}


function add_user(username) {
	collection.findOne({'username': username}, function (err, found_user) {
		if (err) {
			console.log(err);
		} else if (found_user) {
			console.log('user already exists');
		} else {
			var temp_password = random_temp_password();
			var hash = secure_password(temp_password);
			collection.insert({'username': username, 'password': hash}, function (err, data) {
				if (err) {
					console.log(err);
				} else {
					console.log('user ' + username + ' added');
				}
			});
			email_temp_password(username + "@buffalo.edu", temp_password);
		}
	});
}

function random_temp_password(password_length) {
	// FWIW, not cryptographically secure
	var length = password_length || 10;
	var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
	var new_pass = '';
	for (var i = 0; i < length; i++) {
		new_pass += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	return new_pass;
}

function change_password(username, new_password) {
	// assumes the update is authenticated
	console.log('changing password for ' + username);
	var hash = secure_password(new_password);
	collection.updateOne({'username': username}, {$set: {'password': hash}});
}

function secure_password(password) {
	var salt = bcrypt.genSaltSync();
	var hash = bcrypt.hashSync(password, salt);
	return hash;
}

function email_temp_password(email, temp_password) {
	var transporter = nodemailer.createTransport({
		host: 'localhost',
		port: 25,
		tls: {
			rejectUnauthorized: false
		}
	});

	// TODO: Send a link to change password with a token (verify account on first use), instead of email a plaintext password that they won't change

	transporter.sendMail({
		from: 'courses@cse.buffalo.edu',
		replyTo: 'hartloff@buffalo.edu',
		to: email,
		subject: 'CSE Course: temporary password',
		text: 'An account has been created for you to use for you CSE course.' +
		'\n\nYour username is: ' + email_to_ubit(email) +
		'\nYour temporary password is: ' + temp_password +
		'\n\nPlease login and change this password.' +
		'\nhttps://fury.cse.buffalo.edu/user/login'
	});
}

function email_to_ubit(email) {
	return email.trim().toLowerCase().split('@')[0];
}

////
