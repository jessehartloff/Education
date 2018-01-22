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
	//console.log(req.user);
	if (req.user) {
		res.to_template.user = req.user;
	}
	next();
});

router.get('/profile', function (req, res) {
	console.log(res.to_template);
	res.render('user', res.to_template);
});


router.get('/login', function (req, res) {
	res.to_template.prev_path = req.headers.referer;
	console.log("4" + req.headers.referer);
	if(!res.to_template.prev_path){
		res.to_template.prev_path = '/user/profile';
	}
	res.render('login', res.to_template);
});

router.post('/login', function (req, res, next) {
	var destination = req.body.prev_path;
	console.log("6" + req.body.prev_path);

	// Don't follow an outside link. This is not for security, and offers no added security, but for convenience
	// in case someone uses a strange referer or links directly to the login page
	if(!destination || (!destination.includes("localhost") && !destination.includes("fury.cse.buffalo.edu"))){
		destination = '/user/profile';
	}
	passport.authenticate('local', {
		successRedirect: destination,
		failureRedirect: '/user/login',
		failureFlash: true
	})(req, res, next);
});


router.post('/register', function (req, res, next) {
	if (req.body.email) {
		var email = req.body.email.trim().toLowerCase();
		if (email.endsWith('@buffalo.edu')) {
			var username = email_to_ubit(email);
			db.get('users').findOne({'username': username}, {}, function (err, record) {
				if (record) {
					req.flash('error', 'a user with username ' + username + ' already exists. Use the forgot password ' +
						'link to reset your password.');
					res.redirect('/user/login');
				} else {
					add_user(username);
					req.flash('success', "An account has been created with username " + username + ". A verification link " +
						"has been sent to your email. Please verify your email to set your password and log in");
					res.redirect('/user/login');
				}
			});
		} else {
			req.flash('error', 'Enter your @buffalo.edu email address to register');
			res.redirect('/user/login');
		}
	} else {
		req.flash('error', 'No email address found');
		res.redirect('/user/login');
	}
});


router.get('/forgot-password', function (req, res, next) {
	res.render('forgot_password', res.to_template);
});


router.post('/forgot-password', function (req, res, next) {
	if (req.body.email) {
		var email = req.body.email.trim().toLowerCase();
		if (email.endsWith('@buffalo.edu')) {
			var username = email_to_ubit(email);
			db.get('users').findOne({'username': username}, {}, function (err, record) {
				if (record) {
					var token = random_token();
					// expires in 24 hours
					db.get('password_tokens').insert({
						'token': token,
						'username': username,
						'expires': Date.now() + 86400000
					});

					//change_password(username, temp_password);
					email_password_reset_link(username + "@buffalo.edu", token);
					req.flash('info', 'A password reset link has been sent to ' + email);
					res.redirect('/user/login');
				} else {
					req.flash('error', 'User does not exist. Please register an account');
					res.redirect('/user/login');
				}
			});
		} else {
			req.flash('error', 'enter your @buffalo.edu email address');
			res.redirect('/user/login');
		}
	} else {
		req.flash('error', 'no email address found');
		res.redirect('/user/login');
	}
});

router.get('/reset-password/:token', function (req, res) {
	db.get('password_tokens').findOne({'token': req.params.token}, {}, function (err, record) {
		if (record && (Date.now() < record.expires)) {
			res.to_template.token = record.token;
			res.render('reset_password', res.to_template);
		} else {
			req.flash('error', 'Invalid or expired link');
			res.redirect('/user/login');
		}
	});
});

router.post('/reset-password', function (req, res) {
	console.log(req.body.token);
	if (req.body.token) {
		db.get('password_tokens').findOne({'token': req.body.token}, {}, function (err, record) {
			console.log(err);
			console.log(record);
			console.log(Date.now());
			if (record && (Date.now() < record.expires)) {
				if (verify_new_passwords(req, req.body.new_password_1, req.body.new_password_2)) {
					change_password(record.username, req.body.new_password_1);
					req.flash('success', 'Password reset for user: ' + record.username);
					res.redirect('/user/login');
				} else {
					res.to_template.token = record.token;
					res.render('reset_password', res.to_template);
				}
			} else {
				req.flash('error', 'Invalid or expired link');
				res.redirect('/user/login');
			}
		});
	}
});

router.get('/logout', function (req, res) {
	if (req.user) {
		console.log('user ' + req.user.username + ' logged out');
		req.logout();
		req.flash('success', 'logged out');
	} else {
		// not logged in
		req.flash('info', 'already logged out');
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
				if (verify_new_passwords(req, req.body.new_password_1, req.body.new_password_2)) {
					change_password(user.username, req.body.new_password_1);
					req.flash('success', 'password updated');
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
	var course = req.params.course;
	for (var i in req.user.courses_enrolled) {
		var this_course = req.user.courses_enrolled[i];
		if (this_course.course_key === course) {
			for (var option_key in this_course.options) {
				if (req.body[option_key] || req.body[option_key] === '') {
					var new_value = req.body[option_key];
					req.user.courses_enrolled[course].options[option_key].value = new_value;

					var set_string = 'courses_enrolled.' + course + '.options.' + option_key + '.value';
					var to_set = {$set: {}};
					to_set.$set[set_string] = new_value;

					collection.update({'username': req.user.username}, to_set);

				}
			}
		}
	}
	res.redirect('/user/profile');
});


app.use('/user', router);
module.exports = app;


///// Utils


function add_user(username) {
	collection.findOne({'username': username}, function (err, found_user) {
		if (err) {
			console.log(err);
		} else if (found_user) {
			console.log('user already exists: ' + username);
			req.flash('error', 'User already exists');
		} else {
			var temp_password = random_temp_password(50);
			var hash = secure_password(temp_password);
			collection.insert({'username': username, 'password': hash, 'courses_enrolled': {}}, function (err, data) {
				if (err) {
					console.log(err);
				} else {
					console.log('user ' + username + ' added');
				}
			});

			var token = random_token();
			db.get('password_tokens').insert({'token': token, 'username': username, 'expires': Date.now() + 86400000});
			email_password_reset_link(username + "@buffalo.edu", token);
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

function random_token(token_length) {
	// FWIW, not cryptographically secure
	var length = token_length || 16;
	var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var token = '';
	for (var i = 0; i < length; i++) {
		token += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	return token;
}

function change_password(username, new_password) {
	// assumes the update is authenticated
	console.log('changing password for ' + username);
	var hash = secure_password(new_password);
	collection.update({'username': username}, {$set: {'password': hash}});
}

function verify_new_passwords(req, password1, password2) {
	if (password1 !== password2) {
		req.flash('error', 'new passwords do not match');
	} else {
		var magic_eight_ball = 8;
		if (password1.length < magic_eight_ball) {
			req.flash('error', 'password must contain at least ' + magic_eight_ball + ' characters');
		} else {
			return true;
		}
	}
	return false;
}

function secure_password(password) {
	var salt = bcrypt.genSaltSync();
	var hash = bcrypt.hashSync(password, salt);
	return hash;
}

function email_password_reset_link(email, token) {
	var transporter = nodemailer.createTransport({
		host: 'localhost',
		port: 25,
		tls: {
			rejectUnauthorized: false
		}
	});

	console.log('verification link: ' + 'https://fury.cse.buffalo.edu/user/reset-password/' + token);

	transporter.sendMail({
		from: 'courses@cse.buffalo.edu',
		//replyTo: 'hartloff@buffalo.edu',
		to: email,
		subject: 'CSE Course: Set password',
		text: 'Click the link below to set your password' +
		'\n\nusername: ' + email_to_ubit(email) +
		'\nverification link: ' + 'https://fury.cse.buffalo.edu/user/reset-password/' + token +
		'\n\nPlease login and set your password.'
	});
}


function email_to_ubit(email) {
	return email.trim().toLowerCase().split('@')[0];
}
