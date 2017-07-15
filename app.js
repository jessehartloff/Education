var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var course_routes = require('./routes/course');
var index_routes = require('./routes/index');
var preprocessor = require('./util/preprocessor');
var handlebar_helpers = require('./util/handlebars_helpers');

var app = express();

// view engine setup
var hbs = exphbs.create({defaultLayout: 'main',
	helpers : handlebar_helpers});
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
hbs.getPartials();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		data.users.findOne({ username: username }, function (err, user) {
			if (err) { return done(err); }
			if (!user) {
				console.log('bad username');
				return done(null, false, { message: 'Incorrect username.' });
			}
			if (user.password !== password) {
				console.log('bad password');
				return done(null, false, { message: 'Incorrect password.' });
			}
			console.log('logged in!');
			return done(null, user);
		});
	}
));

app.post('/login', function(req, res, next){
	passport.authenticate('local', { successRedirect: '/',
		failureRedirect: '/'})(req, res, next);
});

app.use(function (req, res, next) {
	req.db = db;
	next();
});


app.use(preprocessor);

app.use('/', index_routes);
app.use('/courses', course_routes);
//app.use('/', attendance_routes);
//app.use('/', office_hours_routes);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;

