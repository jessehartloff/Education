var express = require('express');
var router = express.Router();
var request = require('request');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var collection_songs = db.get('songDetails');
var collection_ratings = db.get('songRatings');


router.get('/cse115', function (req, res) {

	var userAgent = req.get('User-Agent');
	//console.log(userAgent);
	var question = req.query["question"];

	if (userAgent.indexOf("Java") == -1) {
		res.send("You must use Java to connect to this api");
	}
	else if (!question) {
		res.send('question parameter not found in query string');
	}
	else if (question === "q1") {
		res.send("77");
	}
	else if (question === "q2") {
		res.send("163");
	} else {
		res.send("Not a valid question");
	}

//https://fury.cse.buffalo.edu/api/cse115?question=q2

});






function clean_url(url) {
	return url.split('{')[0];
}


// Music Ratings
//http://fury.cse.buffalo.edu/api/musicRatings/getAllSongs
router.get('/musicRatings/getAllSongs', function (req, res) {

	var results = {};
	collection_songs.find({}, {"_id":0}, function (err, song_details) {
		if (err) {
			req.send("error while getting ratings");
		} else {
			//console.log(song_details);

			for (var index = 0; index < song_details.length; index++) {
				var current_song = song_details[index];
				current_song["ratings"] = [];
				results[current_song.youtubeID] = current_song;
			}
			collection_ratings.find({}, {}, function (err, all_ratings) {

				//console.log(all_ratings);
				for (var i = 0; i < all_ratings.length; i++) {
					var current_rating = all_ratings[i];
					results[current_rating.youtubeID]["ratings"].push(current_rating.rating);
				}


				var to_send = [];
				for (var id in results) {
					to_send.push(results[id]);
				}

				// shuffle
				for (var i = to_send.length; i > 0; i--) {
					var random_index = Math.floor(Math.random() * i);
					var temp = to_send[i - 1];
					to_send[i - 1] = to_send[random_index];
					to_send[random_index] = temp;
				}

				//console.log(to_send);
				res.send(JSON.stringify(to_send));

			})
		}
	});

	//{"title":"No Regrets", "artist":"Aesop Rock", "ratings":[5,5,4,5], "youtubeID":"sClhmDN5Fcs"}

});

router.post('/musicRatings/rateSong', function (req, res) {

	var current_course = "cse115-s18";

	if (!req.user) {
		req.flash("error", "you must be logged in to rate songs");
		res.redirect('/courses/' + current_course + '/assignments/hw');
	} else {

		var youtubeID = req.body.youtube_id;
		var rating = req.body.rating;
		var artist = req.body.artist;
		var title = req.body.title;

		var rater = req.user.username;

		if (youtubeID.length !== 11) {
			req.flash("error", "invalid youtube id");
			res.redirect('/courses/' + current_course + '/assignments/hw');
		} else if (!rating) {
			req.flash("error", "rating cannot be blank");
			res.redirect('/courses/' + current_course + '/assignments/hw');
		}else if (!(rating === "1" || rating === "2" || rating === "3" || rating === "4" || rating === "5")) {
			req.flash("error", "What's important is that you tried. Always test sites. Never trust users.");
			res.redirect('/courses/' + current_course + '/assignments/hw');
		} else {

			collection_songs.findOne({"youtubeID": youtubeID}, {}, function (err, record) {
				if (err) {
					req.flash("error", "error while rating song");
					res.redirect('/courses/' + current_course + '/assignments/hw');
				} else if (record) {
					// add rating to existing song
					collection_ratings.findOne({"youtubeID": youtubeID, "rater": rater}, {}, function (err, record) {
						if (record) {
							collection_ratings.update({"youtubeID": youtubeID, "rater": rater},
								{"youtubeID": youtubeID, "rater": rater, "rating": parseInt(rating)}, function () {
									req.flash("success", "Updated your existing rating for " + youtubeID);
									res.redirect('/courses/' + current_course + '/assignments/hw');
								});
						} else {
							collection_ratings.insert({
								"youtubeID": youtubeID,
								"rater": rater,
								"rating": parseInt(rating)
							}, function () {
								req.flash("success", "Rated " + youtubeID);
								res.redirect('/courses/' + current_course + '/assignments/hw');
							});
						}
					})
				} else {
					// create new song
					if (!title || !artist) {
						req.flash("error", "title and artist are required for new songs");
						res.redirect('/courses/' + current_course + '/assignments/hw');
					} else {
						collection_songs.insert({
							"youtubeID": youtubeID,
							"title": title,
							"artist": artist
						}, function (err) {
							if (err) {
								req.flash("error", "error while rating song");
								res.redirect('/courses/' + current_course + '/assignments/hw');
							} else {
								collection_ratings.insert({
									"youtubeID": youtubeID,
									"rater": rater,
									"rating": parseInt(rating)
								}, function () {
									req.flash("success", "Rated " + youtubeID);
									res.redirect('/courses/' + current_course + '/assignments/hw');
								});
							}
						})
					}
				}
			});
		}
	}

});

// end Music Ratings


module.exports = router;