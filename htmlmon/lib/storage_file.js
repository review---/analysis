var common = require(__dirname + '/common.js');
var serializer = require(__dirname + '/serializer.js');

var fs     = require('fs');
var path   = require('path');

function StorageFile(file) {
	if ( file )  this.datafile = path.resolve(file);
}


StorageFile.prototype.init = function() {
  try {
    common.mkdirp(path.dirname(this.datafile));
  }catch(e){
    process.stderr.write(e.stack);
    process.exit(1); // fatal
  }
  return this;
}

StorageFile.prototype.load = function() {
	return serializer.deserialize(fs.readFileSync(this.datafile));
}

StorageFile.prototype.save = function(data) {
  fs.writeFileSync(this.datafile,serializer.serialize(data));
}

StorageFile.prototype.reset = function() {
  try { 
    fs.unlinkSync(this.datafile);
  }catch(e){
  }
}


exports.storage_file = function(file) { 
	return new StorageFile(file);
}
