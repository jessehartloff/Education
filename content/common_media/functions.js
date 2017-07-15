function after_load() {
	//prepare_all_deeper_dives();
	//prepare_all_references();
	prepare_all_collapsed_content(document);

	var objDiv = document.getElementById("right-bar");
	objDiv.scrollTop = objDiv.scrollHeight;
}

function prepare_all_collapsed_content(element) {
	var content_classes = ['deeper-dive', 'reference'];
	for (var j in content_classes) {
		var content_elements = element.getElementsByClassName(content_classes[j]);
		for (var i = 0; i < content_elements.length; i++) {
			prepare_collapsed_content(content_elements[i], content_classes[j]);
		}
	}
}


function prepare_collapsed_content(content_element, content_class) {
	content_element.setAttribute('data-activated', 'false');
	content_element.innerHTML = content_link(content_element, content_class);
}

function content_link(content_element, content_class) {
	var concept = content_element.getAttribute('data-concept');
	var topic = content_element.getAttribute('data-topic');

	// not pretty
	var link = "";
	link += "<span class=\"" + content_class + "-link\" ";
	link += "onclick=\"toggle_content(this.parentElement, '" + concept + "', '" + topic + "', '" + content_class + "')\">";
	link += "<span class=\"glyphicon glyphicon-";
	link += content_element.getAttribute('data-activated') !== 'true' ? "plus-sign" : "minus-sign";
	link += "\" aria-hidden=\"true\"></span> ";

	// Capitalization: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
	link += topic.replace("-", " ").replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
	link += "</span>";

	return link;
	// Capitalization: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
}


function toggle_content(element, concept, topic, content_class) {
	if (element.getAttribute('data-activated') === 'true') {
		element.setAttribute('data-activated', 'false');
		element.innerHTML = content_link(element, content_class);
	} else {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				var response = JSON.parse(this.responseText);
				element.setAttribute('data-activated', 'true');
				element.innerHTML =
					content_link(element, content_class) +
					'<div class="well lecture-section-well ' + content_class + '-well">' +
					'<h4>' + response.title + '</h4>' +
					response.content + '</div>';
				prepare_all_collapsed_content(element);
				hljs.initHighlighting.called = false;
				hljs.initHighlighting();
			}
		};
		xhttp.open("GET", "/courses/" + course + "/" + content_class + "/" + concept + "/" + topic, true);
		xhttp.send();
	}
}


//function prepare_all_deeper_dives() {
//	var deeper_dives = document.getElementsByClassName('deeper-dive');
//	for (var i = 0; i < deeper_dives.length; i++) {
//		prepare_deeper_dive(deeper_dives[i]);
//	}
//}
//
//function prepare_all_references() {
//	var references = document.getElementsByClassName('reference');
//	for (var i = 0; i < references.length; i++) {
//		prepare_reference(references[i]);
//	}
//}
//
//function prepare_deeper_dive(deeper_dive_element) {
//	deeper_dive_element.setAttribute('data-activated', 'false');
//	deeper_dive_element.innerHTML = deeper_dive_link(deeper_dive_element);
//}
//
//function prepare_reference() {
//}
//
//function toggle_deeper_dive(element, concept, topic) {
//	if (element.getAttribute('data-activated') === 'true') {
//		//var topic = element.getAttribute('data-topic');
//		element.setAttribute('data-activated', 'false');
//		element.innerHTML = deeper_dive_link(element);
//	} else {
//		var xhttp = new XMLHttpRequest();
//		xhttp.onreadystatechange = function () {
//			if (this.readyState == 4 && this.status == 200) {
//				var response = JSON.parse(this.responseText);
//				element.setAttribute('data-activated', 'true');
//				element.innerHTML =
//					deeper_dive_link(element) +
//					'<div class="well lecture-section-well deep-dive-well">' +
//					'<h5>' + response.title + '</h5>' +
//					response.content + '</div>';
//				var more_deeper_dives = element.getElementsByClassName('deeper-dive');
//				for (var i in more_deeper_dives) {
//					prepare_deeper_dive(more_deeper_dives[i]);
//				}
//			}
//		};
//		xhttp.open("GET", "/courses/" + course + "/deep-dives/" + concept + "/" + topic, true);
//		xhttp.send();
//	}
//}
//
//function deeper_dive_link(deeper_dive_element) {
//	var concept = deeper_dive_element.getAttribute('data-concept');
//	var topic = deeper_dive_element.getAttribute('data-topic');
//	//deeper_dive_element.setAttribute('onclick', 'toggle_deeper_dive(this, "' + concept + '", "' + topic + '")');
//
//	// not pretty
//	var link = "";
//	link += "<span class=\"deeper_dive_link\" ";
//	link += "onclick=\"toggle_deeper_dive(this.parentElement, '" + concept + "', '" + topic + "')\">";
//	link += "<span class=\"glyphicon glyphicon-";
//	link += deeper_dive_element.getAttribute('data-activated') !== 'true' ? "plus-sign" : "minus-sign";
//	link += "\" aria-hidden=\"true\"></span> ";
//
//	// Capitalization: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
//	link += topic.replace("-", " ").replace(/\w\S*/g, function (txt) {
//		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
//	});
//	link += "</span>";
//
//	return link;
//	// Capitalization: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
//}

function loadVideo(element, youTube) {
	element.innerHTML = "<iframe class=\"embed-responsive-item\" src=\"https://www.youtube.com/embed/" + youTube + "?autoplay=1\" allowfullscreen></iframe>";
}