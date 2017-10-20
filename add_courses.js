var fs = require('fs-extra');
var path = require('path');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var collection = db.get('course_content');
var collection_list = db.get('course_list');


var current_semester = 'f17';
var content_directory = path.join(__dirname, 'content/');
var media_destination = path.join(__dirname, 'public/static/');
fs.copySync(content_directory + "common_media/", media_destination);

var to_process = [
	//{
	//	'directory': content_directory + 's18/cse312',
	//	'semester': 's18',
	//	'number': 'cse312',
	//	'title': 'Web Applications'
	//},

	{
		'directory': content_directory + 'f17/cse115',
		'semester': 'f17',
		'number': 'cse115',
		'number_only': '115',
		'title': 'Computer Science 1'
	},
	{
		'directory': content_directory + 'f17/cse442',
		'semester': 'f17',
		'number': 'cse442',
		'number_only': '442',
		'title': 'Software Engineering'
	},

	{
		'directory': content_directory + 's17/cse115',
		'semester': 's17',
		'number': 'cse115',
		'number_only': '115',
		'title': 'Computer Science 1'
	},

	{
		'directory': content_directory + 'f16/cse442',
		'semester': 'f16',
		'number': 'cse442',
		'number_only': '442',
		'title': 'Software Engineering',
		'project': 'old'
	},

	{
		'directory': content_directory + 'u16/cse442',
		'semester': 'u16',
		'number': 'cse442',
		'number_only': '442',
		'title': 'Software Engineering'
	}
];

var semesters = ['u16', 'f16', 's17', 'f17', 's18'];

collection.remove({}, function (err, content) {
	collection_list.remove({}, function (err, content2) {
		if (err) {
			console.log(err);
		} else {
			//console.log("all courses removed");
			//console.log("adding all courses");
			var courses_processed = 0;
			for (var index in to_process) {
				var course = to_process[index];
				course['archived'] = course.semester !== current_semester;
				course['course'] = course.number + '-' + course.semester;
				course['number_upper'] = course.number.toUpperCase();
				course['semester_index'] = semesters.indexOf(course.semester);
				collection_list.insert(course);
				var list = fs.readdirSync(course.directory);
				for (var j in list) {
					var sub_directory = list[j];
					switch (sub_directory) {
						case "assignments":
							read_directory(course, course.directory + "/assignments/", "assignments", true);
							break;
						case "lectures":
							read_directory(course, course.directory + "/lectures/", "lectures", true);
							break;
						case "media":
							fs.copySync(course.directory + "/media/", media_destination);
							break;
						case "extra":
							read_directory(course, course.directory + "/extra/", "extra", true);
							break;
						case "groups":
							if (course.project === "old") {
								parse_old_project(course, course.directory + "/groups/")
							}
							break;
						case "deep-dives":
							read_directory(course, course.directory + "/deep-dives/", "deep_dives", false);
							break;
						case "options":
							var course_content = fs.readFileSync(course.directory + "/options/course.json");
							var course_settings = JSON.parse(course_content);
							course.course_options = course_settings;
							if (course_settings.student_account && course_settings.student_options) {
								var student_content = fs.readFileSync(course.directory + "/options/student.json");
								var student_options = JSON.parse(student_content);
								course.student_options = student_options;
							}
							if (course_settings.has_project) {
								var project_content = fs.readFileSync(course.directory + "/options/project.json");
								var project_options = JSON.parse(project_content);
								course.project_options = project_options;
							}
							//{
							//	"student_account": true,
							//	"student_options": true,
							//	"has_project": true
							//}


							break;
					}

				}
				console.log('adding: ' + course.course);
				collection.insert(course, function () {
					courses_processed++;
					//console.log(courses_processed + ' courses processed');
					if (courses_processed === to_process.length) {
						console.log('all courses processed');
						shut_it_down();
					}
				});
				//console.log(JSON.stringify(course, null, 4));
			}
		}
	});
});


function read_directory(course, directory, type, ordered) {

	var all_content = [];
	var list = fs.readdirSync(directory);
	for (var i in list) {
		var file = list[i];

		var content = fs.readFileSync(directory + file);
		var variables = {};
		var sections = [];

		var lines = content.toString().split('\n');
		var state = 'normal';
		var section_title = "";
		var section_content = "";

		for (var j in lines) {
			var line = lines[j];
			if (state === 'normal') {
				if (line.trim() === '---') {
					state = 'variables';
				}
				else if (line.startsWith('==')) {
					if (section_title !== "") {
						sections.push({
							'title': section_title,
							'title_lookup': section_title.toLowerCase().replace(/\s+/g, '-'),
							'content': section_content
						});
						section_content = "";
					}
					section_title = line.slice(2).trim();
				} else if (section_title !== "") {
					section_content += line + '\n';
				}

			} else if (state === 'variables') {
				if (line.trim() === '---') {
					state = 'normal';
					continue;
				}
				parse_variable_line(line, variables);
			}
		}

		if (section_title !== "" && section_content !== "") {
			sections.push({'title': section_title, 'content': section_content});
		}

		all_content.push(Object.assign(variables, {'sections': sections}));
	}

	if (ordered) {
		var result = [];
		order_list(all_content, 'none', result);
		course[type] = result;
	} else {
		result = {};
		for (var i in all_content) {
			var topic = all_content[i];
			result[topic.short_title] = {};
			for (var j in topic.sections) {
				var section = topic.sections[j];
				result[topic.short_title][section.title.toLowerCase().trim().replace(/\s+/g, '-')] = {
					'title': section.title,
					'content': section.content
				}
			}
		}
		course[type] = result;
	}
}

function order_list(content, previous, result) {

	//console.log(result);
	for (var i in content) {
		var this_content = content[i];
		if (this_content.previous_content_short === previous) {
			var new_previous = this_content.short_title;
			result.push(this_content);
			if (this_content.next_content_short === 'none') {
				return;
			}
			break;
		}
	}
	order_list(content, new_previous, result);
}


function parse_variable_line(line, variables) {
	var colon_index = line.indexOf(':');
	if (colon_index === -1) {
		console.log('error parsing variable: ' + line);
		return;
	}
	variables[line.slice(0, colon_index).trim()] = line.slice(colon_index + 1).trim();
}


function parse_old_project(course, directory) {

	var groups = {};

	//group.has_landing
	//group.landing_link
	//group.name
	//group.slack_channel
	//group.videos [video.link, video.occasion]
	//group.has_extras
	//group.extras [extra.link, extra.type]
	//group.description
	//group.developers [ubit]
	//group.ta
	//group.private
	//group.repositories [repo.link]

	var files = ['groups', 'group_descriptions', 'ta-groups.txt', 'AllRepos',
		'landing_pages', 'AllVideos', 'beta_testing', 'content_creation'];

	var lines_groups = fs.readFileSync(directory + 'groups').toString().split('\n');
	var lines_group_descriptions = fs.readFileSync(directory + 'group_descriptions').toString().split('\n');
	var lines_ta_groups = fs.readFileSync(directory + 'ta-groups.txt').toString().split('\n');
	var lines_AllRepos = fs.readFileSync(directory + 'AllRepos').toString().split('\n');
	var lines_landing_pages = fs.readFileSync(directory + 'landing_pages').toString().split('\n');
	var lines_AllVideos = fs.readFileSync(directory + 'AllVideos').toString().split('\n');
	var lines_beta_testing = fs.readFileSync(directory + 'beta_testing').toString().split('\n');
	var lines_content_creation = fs.readFileSync(directory + 'content_creation').toString().split('\n');

	for (var i in lines_groups) {
		var line = lines_groups[i];
		var splits = line.split('\t');
		var group_name = splits[0].trim();
		groups[group_name] = {
			'has_landing': false, 'name': group_name, 'videos': [], 'has_extras': false,
			'extras': [], 'developers': [], 'private': false, 'repositories': []
		};
		var ubits = splits[1].split(',');
		for (var j in ubits) {
			var ubit = ubits[j].trim();
			groups[group_name].developers.push(ubit);
		}
	}

	for (var i in lines_group_descriptions) {
		var line = lines_group_descriptions[i];
		var splits = line.split('\t');
		var group_name = splits[0].trim();
		var group_slack = splits[1].trim();
		var group_description = splits[2].trim();
		groups[group_name].slack_channel = group_slack;
		groups[group_name].description = group_description;
	}

	for (var i in lines_ta_groups) {
		var line = lines_ta_groups[i];
		var splits = line.split('\t');
		var group_name = splits[0].trim();
		var group_ta = splits[1].trim();
		groups[group_name].ta = group_ta;
	}

	for (var i in lines_AllRepos) {
		var line = lines_AllRepos[i];
		var splits = line.split('\t');
		if (splits.length < 2) {
			continue;
		}
		var group_name = splits[0].trim();
		var group_repos = splits[1].trim().split(';');
		for (var j in group_repos) {
			var repo = group_repos[j].trim();
			groups[group_name].repositories.push(repo.trim());
		}
	}

	for (var i in lines_landing_pages) {
		var line = lines_landing_pages[i];
		var splits = line.split(',');
		var group_name = splits[0].trim();
		var group_landing_page = splits[1].trim();
		groups[group_name].has_landing = true;
		groups[group_name].landing_link = group_landing_page;
	}

	for (var i in lines_AllVideos) {
		var line = lines_AllVideos[i];
		var splits = line.split('\t');
		var group_name = splits[2].trim();
		var video_occasion = splits[3].trim();
		var video_link = youtube_parser(splits[4].trim());
		groups[group_name].videos.push({'occasion': video_occasion, 'link': video_link});
	}

	for (var i in groups) {
		var group = groups[i];
		group.videos.reverse();
	}

	for (var i in lines_beta_testing) {
		var line = lines_beta_testing[i];
		var splits = line.split(',');
		var group_name = splits[0].trim();
		var group_beta_link = splits[1].trim();
		groups[group_name].has_extras = true;
		groups[group_name].extras.push({'link': group_beta_link, 'type': 'Beta Testing'});
	}


	for (var i in lines_content_creation) {
		var line = lines_content_creation[i];
		var splits = line.split(',');
		var group_name = splits[0].trim();
		var group_cc_link = splits[1].trim();
		groups[group_name].has_extras = true;
		groups[group_name].extras.push({'link': group_cc_link, 'type': 'Content Creation'});
	}

	var group_names = Object.keys(groups);
	group_names.sort(function (s1, s2) {
		return s1.toLowerCase().localeCompare(s2.toLowerCase())
	});
	var groups_list = [];
	for (var i in group_names) {
		groups_list.push(groups[group_names[i]]);
	}
	//console.log(groups_list);
	course.projects = groups_list;
}


// https://stackoverflow.com/questions/3452546/javascript-regex-how-do-i-get-the-youtube-video-id-from-a-url
function youtube_parser(url) {
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
	var match = url.match(regExp);
	return (match && match[7].length == 11) ? match[7] : false;
}


function shut_it_down() {
	db.close();
}

