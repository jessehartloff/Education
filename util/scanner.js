var fs = require("fs-extra");
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');
var collection_ps = db.get('ps');

// This function is gross.. but it works
function extract_number_from_scan(scan) {
	var splits = scan.split('^');
	var person_number = "";
	if (splits.length < 3) {
		// could be person number input instead of scan
		if (scan.length == 8) {
			return scan;
		} else {
			return "error";
		}
	} else {
		person_number = splits[2];
		if (person_number.length < 23) {
			return "error";
		}
		person_number = person_number.substring(14, 22);
		return person_number;
	}
}


exports.scan_to_username = function scan_to_username(scan, req, res, next){
	//console.log("scan: " + scan);
	if (!scan) {
		console.log("bad scan: " + scan);
		return scan;
	}
	var number = extract_number_from_scan(scan);
	//console.log("number: " + number);
	collection_ps.findOne({"id":number}, {}, function(err, record){
		if(err || !record){
			next(req, res, "");
		}else{
			//console.log("record: " + JSON.stringify(record));
			next(req, res, record);
		}
	});
};