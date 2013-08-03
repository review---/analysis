#!/usr/bin/env node
// Install these packages.
//   npm install getopt
//   npm install jsdom
process.eputs = function(str){
  process.stderr.write(str+'\n');
}

//----------------------------------------------
// Node modules
//----------------------------------------------
//var sys = require('sys');
var sys = require('util');
var opt = require('getopt');
var fs = require('fs');
var mongodb = require('mongodb');
var sync = require('synchronize');

//----------------------------------------------
// Definitions
//----------------------------------------------
var MEM_THRESHOLD = 300*1024*1024; // byte
var DATA_DIR = __dirname + '/data';

//---------------
// Environments
process.chdir(__dirname);
var common = require(__dirname + '/lib/common.js');
common.mkdirp(DATA_DIR);

//----------------------------------------------
// Options
//----------------------------------------------
var WORKER  = null;
var JOBS    = 1;
var LOGLV   =  6;
var FILE    = null;
var MULTI   = false;
var MONGO_NODE ='127.0.0.1:27017/htmlmon';
var FIELD='body';
var MONGO_NODE='127.0.0.1:27017/htmlmon';
var MONGO_COL=null;
var OUT='STDOUT';
var CLEAR=null;

var TERM_FLG = false; // signal flag
process.on('SIGINT', function () {
  process.eputs('SIGINT Received !');
  TERM_FLG = true;
});

function help(a){
  sys.puts('Usage:');
  sys.puts('   node parsehtml.js [-f <inputfile>] [-l loglv]');
  sys.puts('Options:');
  sys.puts('   -l <loglv>     : Specify the loglv from 0 to 20 ( 6 is defalut )');
  sys.puts('   -f <inputfile> : Specify htmlfile otherwise read html from STDIN');
  sys.puts('   -o <method>    : Output method      > STDOUT or 172.0.0.1:27017/htmlmon');
  sys.puts('   -m             : Multiple line mode when STDIN');
  sys.puts('   -F <field>     : HTML Field name    > body');
  sys.puts('   -M <node>      : MongoDB instance   > 127.0.0.1:27017/htmlmon');
  sys.puts('   -C <collection>: MongoDB collection name');
  sys.puts('   -c             : Clear job collection');
  sys.puts('   -j <number>    : # Job process');
  process.exit(a);
}

try {
  opt.setopt('hl:f:o:mF:M:C:cj:W',process.argv);
  opt.getopt(function ( o , p ){
    switch (o) {
      case 'h':
      help(0);
      break;
      case 'l':
      LOGLV = p;
      break;
      case 'f':
      FILE = ''+p;
      break;
      case 'm':
      MULTI = true;
      break;
      case 'F':
      FIELD = ''+p;
      break;
      case 'M':
      MONGO_NODE = ''+p;
      break;
      case 'C':
      MONGO_COL = ''+p;
      break;
      case 'o':
      OUT = ''+p;
      break;
      case 'c':
      CLEAR = true;
      break;
      case 'j':
      JOBS = ''+p;
      break;
      case 'W':
      WORKER = 1;
      break;
    }
  });
}catch ( e ) {
  process.eputs('Invalid option ! "' + e.opt + '" => ' + e.type);
  help(1);
}

var LOG   = DATA_DIR + '/htmlpick.log';
var log = require( __dirname + '/lib/log.js').log(LOG,LOGLV).init();

function fork_worker(){
  var worker = child_process.spawn(cmd,child_argv);
  worker.stdout.on('data',function(data){
    process.stdout.write(data);
  });
  worker.stderr.on('data',function(data){
    process.stderr.write(data);
  });
  worker.on('exit',function (code ) {
		sync.fiber(function(){
    log.echo('== PARENT ==','Wait child ',code);
    if ( code === 2 && !TERM_FLG ) {
				fork_worker();
    }else{
		
		}
		});
	});
}
if ( ! WORKER ) { 
  var child_process  = require('child_process');
  var cmd = process.argv.shift();
	
  var child_argv = process.argv.concat();
  child_argv.push('-W');
	var jobs = parseInt(JOBS);
	for ( var i=0; i < jobs; i++ ) {
		fork_worker();
	}
  return;
}



sync.fiber(function(){
	function StdOut(){
	}
	StdOut.prototype.out = function(ret){
		log.message(ret._id,'stdout','','');
		sys.puts(JSON.stringify(ret));
	}
	StdOut.prototype.err = function(id){
		log.error(id,'error','','');
	}
	StdOut.prototype.drop = function(){
	}
	var out = new StdOut();

	function MongoOut(){
		var out_split = OUT.split(':');
		var host = out_split[0];
		var out_split_split = out_split[1].split('/');
		var port = out_split_split[0];
		var dbname = out_split_split[1];
		this.db = new mongodb.Db(dbname,
														 mongodb.Server(host,port),
														 { safe:true}
														 );
		sync.await(this.db.open(sync.defer()));
		this.col = this.db.collection(MONGO_COL+'.out');
	}
	MongoOut.prototype.out = function(ret){
		log.message(ret._id,'mongoout','','');
		ret.st  = 'success'
		this.col.save(ret,function(){});
	}
	MongoOut.prototype.err = function(id,reason){
		log.error(id,'error','','');
		var ret = {};
		ret._id = id;
		ret.st  = 'error'
		ret.reason  = reason
		this.col.save(ret,function(){});
	}
	MongoOut.prototype.drop = function(){
		log.message('== drop ==','mongoout','','');
		try {
			sync.await(this.col.drop(sync.defer()));
		}catch(e){
		}
		sync.await(this.col.ensureIndex({st:1},sync.defer()));
	}
	if ( OUT !== 'STDOUT' ) {
		out = new MongoOut();
	}
	
	var P = require(__dirname + '/lib/html_picker.js').html_picker(out);
	if ( MONGO_COL ) {
		fromMongo();
		return;
	}
	
	if ( FILE ) {
		fromFile();
		return;
	}
	fromStdIn();


	function gettext(id,body,callback){
		P.pick(id,body,['#topicsDetailCmp','#articleDetailCmp'],callback);
	}

	function fromMongo(){
		var node = MONGO_NODE;
		var colname = MONGO_COL;
		log.echo(colname,'=== START (MONGO) ===',FIELD,node);
		var node_split = node.split(':');
		var host = node_split[0];
		var node_split_split = node_split[1].split('/');
		var port = node_split_split[0];
		var dbname = node_split_split[1];
		sync.fiber(function(){
			var db = new mongodb.Db(dbname,
															mongodb.Server(host,port),
															{ safe:true}
															);
			try {
				sync.await(db.open(sync.defer()));
				var col = db.collection(colname);
				var job = db.collection(colname+'.job');
				if ( CLEAR ) {
					out.drop();
					try {
						sync.await(job.drop(sync.defer()));
					}catch(e){
					}
					var colstat = sync.await(col.stats(sync.defer()));
					var cursor = sync.await(col.find({},{_id:1},sync.defer()));
					cursor.each(function(e,obj){
						if ( ! (obj && '_id' in obj) ){
							cursor.close();
							return;
						}
						obj.st=0;
						job.save(obj,function(){});
					});
					var interval = setInterval(function(){
						sync.fiber(function(){
							var jobstat = sync.await(job.stats(sync.defer()));
							if ( jobstat.count == colstat.count ) {
								clearInterval(interval);
								sync.await(job.ensureIndex({st:1},sync.defer()));
								log.echo(colname,'=== CLEAR (MONGO) ===',jobstat.count,node);
								setTimeout(function(){
									db.close();
									process.exit(0);
								},500);
							}
						});
					},1000);
					return;
				}
				while (true ){
					var m = process.memoryUsage();
					if (  TERM_FLG  || m.heapUsed >  MEM_THRESHOLD ) {
						log.echo('=== Interrupt ===',m.heapUsed + ' > ' + MEM_THRESHOLD,colname);
						setTimeout(function(){
							db.close();
							process.exit(2);
						},3000);
						return;
					}
					var prev = sync.await(job.findAndModify(
																									{st:0},
																									{},
																									{'$set':{st:1}},
																									{},
																									sync.defer()));
					if ( !(prev && '_id' in prev) ) {
						setTimeout(function(){
							log.echo('=== END (MONGO) ===','No job',colname);
							db.close();
							process.exit(0);
						},3000);
						return;
					}
					var filter = {};
					filter[FIELD] = 1;
					var doc = sync.await(col.findOne({_id:prev._id},filter,sync.defer()));
					gettext(doc._id,doc[FIELD],function(id,ret){
						sys.puts(id);
						if ( ret ) {
							job.update({_id:id},{'$set':{st:2}},function(){});
						}else{
							job.update({_id:id},{'$set':{st:-1}},function(){});
						}
					});
				}
			}catch(e){
				log.error(colname,e,'',node);
				process.exit(0);
			}
		});
	}
	function fromFile(){
		log.echo(FILE,'=== START (FILE) ===',FIELD);
		var html = fs.readFileSync(FILE);
		gettext(FILE,html);
		setTimeout(function(){
			process.exit(0);
		},5000);
	}
	function fromStdIn(){
		log.echo('STDIN','=== START (STDIN) ===',FIELD);
		function procline(chunk,end){
			var lines = chunk.split("\n");
			var ret;
			if ( ! end ) {
				ret = lines.pop();
			}
			for ( var b in lines ) {
				var line = lines[b];
				if ( ! line ) {
					continue;
				}
				var json = JSON.parse(line);
				gettext(json._id,json[FIELD]);
			}
			return ret;
		}
		var html = '';
		process.stdin.on('data',function(chunk){
			html += chunk;
			if ( MULTI ) {
				html = procline(html,false);
			}
		});
		process.stdin.on('end',function(){
			if ( MULTI ) {
				procline(html,true);
			}else{
				var json = JSON.parse(html);
				gettext(json._id,json[FIELD]);
			}
			setTimeout(function(){
				process.exit(0);
			},5000);
		});
	}
	
});

