var log = require('winston');
var fs = require('fs-extra');
var log_directory = '../logs';

if (!fs.existsSync(log_directory)) {
	fs.mkdirSync(log_directory);
}



//log.add(log.transports.File, {
//	filename: log_directory + "/education.log",
//	timestamp: function(){return new Date().toLocaleString();},
//	level: "info"
//});

log.add(log.transports.File, {
	filename: log_directory + "/all_activity.log",
	timestamp: function(){return new Date().toLocaleString();},
	level: "silly"
});

//log.error("swetup");
//log.warn("seqtup");
log.info("logging has begun");
//log.debug("set-up");
//log.verbose("logging has begun");
//log.silly("setu-p");