var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var collection = db.get('projects');

var project_schema = {
	'course': '',
	'team_name': '',
	'members': [],
	'project_name': '',
	'project_description': '',
	'landing_page_link': '',
	'repository_link_primary': '',
	'additional_repository_links': [],
	'communication_channel': '',
	'video_submissions': {},
	'beta_testing': {},
	'ratings': {}
};

//-+Group name
//-+Project name
//-+Project description
//-+Group members
//-+Repo link(s)
//—+Primary repo link (where the issues are tracked)
//-[+might just use github?.. or rocket chat] How to communicate (formerly slack channel)
//-+Video links
//-+Beta testing stuff
//-+*Rating and reviews
//-[Might just be github]Landing page link
//-How to contribute (Content creation)
//-TA(s)?
//	-Documentation?
//	-Grades (not in database)
//	-Issues (Could stay in the repo. Maybe mark certain status like unassigned bounty task)

function new_project(project_id, project_name, team_name) {

}

function rate_project(project, rater, rating) {
	// Check if rater has rated this project before
	// add rating if they haven't
}

