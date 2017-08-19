var express = require('express');
var router = express.Router();
//var users_util = require('../util/users');
//var course_util = require('../util/course');
//var projects_util = require('../util/projects');
//var api_util = require('../util/api');

var request = require('request');

router.post('/', function (req, res) {
	console.log(req.body);
	console.log(req.headers);
	console.log(req.headers['x-github-event']);

	var repo_url = req.body.repository.html_url;

	req.db.get('projects').findOne({
		'repository_link_primary': repo_url
	}, {}, function (err, project) {
		if (err) {
			console.log(err);
			res.send('ACK');
		} else if (!project) {
			console.log('Project not found: ' + repo_url);
			res.send('ACK');
		} else {

			request({url:clean_url(req.body.repository.issues_url),headers: {'User-Agent': 'cse442'}}, function(error, response, body){
				//console.log(body);
				var json_issues = JSON.parse(body);
				var issues = [];
				for(var i in json_issues){
					var this_issue = json_issues[i];
					var issue = {};
					issue['link'] = this_issue['html_url'];
					issue['title'] = this_issue['title'];
					issue['open'] = this_issue['state'] === 'open';
					issue['assigned_to'] = this_issue['assignee']['login'];
					issue['labels'] = [];
					issue['help_wanted'] = false;
					for(var j in this_issue['labels']){
						var this_label = this_issue['labels'][j];
						issue['labels'].push(this_label['name']);
						if(this_label['name'] === 'help wanted'){
							issue['help_wanted'] = true;
						}
					}
					issues.push(issue);
				}

				var to_set = {$set: {'issues': issues}};
				req.db.get('projects').update({'repository_link_primary': repo_url}, to_set);

				res.send('ACK');
			});

			request({url:clean_url(req.body.repository.releases_url),headers: {'User-Agent': 'cse442'}}, function(error, response, body){
				//console.log(body);
				var json_releases = JSON.parse(body);
				var releases = [];
				for(var i in json_releases){
					var this_release = json_releases[i];
					var release = {};
					release['link'] = this_release['html_url'];
					release['tag_name'] = this_release['tag_name'];
					release['name'] = this_release['name'];
					releases.push(release);
				}

				var to_set = {$set: {'releases': releases}};
				req.db.get('projects').update({'repository_link_primary': repo_url}, to_set);

				res.send('ACK');
			});
		}
	});

});


function clean_url(url){
	return url.split('{')[0];
}

module.exports = router;