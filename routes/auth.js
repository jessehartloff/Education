var express = require('express');
var app = express();
var router = express.Router();

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var nodemailer = require('nodemailer');

var bcrypt = require('bcryptjs');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

var collection = db.get('users');

app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.username);
});

passport.deserializeUser(function (user, done) {
	collection.findOne({username: user}, function (err, user) {
		if (err) {
			return done(err);
		} else {
			done(null, user);
		}
	})
});

function local_strategy_function(username, password, done) {
	collection.findOne({username: username}, function (err, user) {
		if (err) {
			return done(err);
		}
		if (!user) {
			console.log('bad username');
			return done(null, false, {message: 'Incorrect username.'});
		}
		if (!bcrypt.compareSync(password, user.password)) {
			console.log('bad password');
			return done(null, false, {message: 'Incorrect password.'});
		}
		console.log('logged in!');
		return done(null, user);
	});
}

passport.use(new LocalStrategy(local_strategy_function));


// Check if a user is logged in
app.use(function (req, res, next) {
	console.log(req.user);
	if (req.user) {
		res.to_template.user = {'username': req.user.username};
	}
	next();
});

router.get('/profile', function (req, res, next) {
	res.render('user', res.to_template);
});


router.get('/login', function (req, res, next) {
	res.render('login', res.to_template);
});

router.post('/login', function (req, res, next) {
	passport.authenticate('local', {
		successRedirect: '/user/profile',
		failureRedirect: '/user/login'
	})(req, res, next);
});



router.post('/register', function (req, res, next) {
	if (req.body.email) {
		var email = req.body.email.trim().toLowerCase();
		if (email.endsWith('@buffalo.edu')) {
			var username = email_to_ubit(email);
			add_user(username);
			res.to_template.message = "An account has been created for you and a temporary password has been sent " +
				"to your email";
			// TODO: a different message for any errors including registering an existing user
			res.render('login', res.to_template);
			return;
		}
	}
	res.to_template.message = "enter your @buffalo.edu email address to register";
	res.render('user', res.to_template);

});


router.get('/logout', function (req, res) {
	if (req.user) {
		req.logout();
		res.redirect('/');
	} else {
		// not logged in
		res.redirect('/');
	}
});

router.post('/change-password', function (req, res) {
	if (req.user && req.body.old_password && req.body.new_password_1 && req.body.new_password_2) {
		local_strategy_function(req.user.username, req.body.old_password, function (err, user, options) {
			if (err) {
				res.render('error', options)
			} else if (!user) {
				res.render('error', options)
			} else if (user.username === req.user.username) {
				// authenticated
				if (req.body.new_password_1 !== req.body.new_password_2) {
					res.render('error', {
						'message': 'new passwords do not match'
					})
				} else {
					change_password(user.username, req.body.new_password_1);
					res.to_template.message = "password updated";
					res.render('user', res.to_template);
				}
			}
		});
	} else {
		res.render('error', {'message': 'could not change password'});
	}
});

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

function random_temp_password() {
	return 'security!';
}

function change_password(username, new_password) {
	// assumes the update is authenticated
	console.log('changing password for ' + username);
	var hash = secure_password(new_password);
	collection.update({'username': username}, {'password': hash});
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

	transporter.sendMail({
		from: 'courses@cse.buffalo.edu',
		replyTo: 'hartloff@buffalo.edu',
		to: email,
		subject: 'temporary password',
		text: 'An account has been created for you to use for you CSE course.' +
		'\n\nYour username is: ' + email_to_ubit(email) +
		'\nYour temporary password is: ' + temp_password +
		'\n\nPlease login and change this password.' +
		'\nhttps://fury.cse.buffalo.edu/user/login'
	});
}

function email_to_ubit(email) {
	return 'hartloff';
}

app.use('/user', router);
module.exports = app;