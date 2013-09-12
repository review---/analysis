var sys    = require('util');
var common = require(__dirname + '/common.js');
var mongodb = require('mongodb');
var sync = require('synchronize');

//---------------------------------
// constructor 
//---------------------------------
function FetchLogger(node,colname) {
	var mongo = common.parse_mongo(node);
	this.host   = mongo.host;
	this.port   = mongo.port;
	this.dbname = mongo.dbname;
	this.colname= colname;
}

FetchLogger.prototype.init = function(drop) {
	this.db = new mongodb.Db(this.dbname,
														mongodb.Server(this.host,this.port),
													 { safe:true}
														);
	sync.await(this.db.open(sync.defer()));
	this.col = this.db.collection(this.colname);
	if ( drop ) {
		try { 
			sync.await(this.col.drop(sync.defer()));
			sync.await(this.col.ensureIndex({ts:1},sync.defer()));
		}catch(e){
		}
	}
//	sync.await(this.col.ensureIndex({status:1},sync.defer()));
//	sync.await(this.col.ensureIndex({code:1},sync.defer()));
//	sync.await(this.col.update( 
//														 {status:{'$ne': 'End'} },
//														 { '$set' : {status:'Queuing',code:'queuing...'} } , 
//														 { multi : true } , sync.defer()));
}

FetchLogger.prototype.status = function( url , status ) {
}
FetchLogger.prototype.header = function( url , header ) {
}
FetchLogger.prototype.body = function( url , status,header,body ) {
	var data = {
			_id: url,
		status:status,
		header:header,
		body:body,
		ts: new Date().getTime()
	};
	sync.await(this.col.save( data, sync.defer()));
}
exports.fetch_logger = function(node,dbname,colname) {
	return new FetchLogger(node,dbname,colname);
}

/*
var fetch_logger_dir;
exports.fetch_logger = function(dir) { 
  if ( dir )  fetch_logger_dir = path.resolve(dir);
  return this;
}

exports.init = function(enable) {
  if ( ! enable ) {
    return {
      status: function(){},
      header: function(){},
      body: function(){}
    };
  }
  try {
    common.mkdirp(fetch_logger_dir);
  }catch(e){
    process.stderr.write(e.stack);
    process.exit(1); // fatal
  }
  return this;
}

//---------------------------------
// operator
//---------------------------------
function get_name(url,ext){
  return fetch_logger_dir + '/' + url.replaceAll(/\//,'#') + '.' + ext;
}
exports.status = function ( url , status ) {
  var fname = get_name(url,'h');
  fs.writeFileSync(fname,''+status+'\n\n');
}
exports.header = function ( url , headers ) {
  var fname = get_name(url,'h');
  var fp = fs.openSync(fname,'a+');
  for( var h in headers ) {
    fs.writeSync(fp,h+':'+headers[h]+'\n',null);
  }
  fs.closeSync(fp);
}
exports.body = function ( url , body ) {
  var fname = get_name(url,'b');
  fs.writeFileSync(fname,body);
}
*/