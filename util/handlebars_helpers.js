
exports.ifOdd = function(number, options){
	return number%2 === 1 ? options.fn(this) : options.inverse(this);
};

exports.ifEven = function(number, options){
	return number%2 === 0 && number !==0 ? options.fn(this) : options.inverse(this);
};

exports.ifIndexLimited = function(course, index, compare, options){
	// :\
	if(course === 'cse115-f17'){
		return index <= compare ? options.fn(this) : options.inverse(this);
	}else{

		return options.fn(this);
	}
};

exports.ifExists = function(object, key, options){
	return object && object[key] ? options.fn(this) : options.inverse(this);
};

exports.ifNotExists = function(object, key, options){
	return !object || !object[key] ? options.fn(this) : options.inverse(this);
};