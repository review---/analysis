#!/usr/bin/env node
process.eputs = function(str){
  process.stderr.write(str+'\n');
}

//----------------------------------------------
// Node modules
//----------------------------------------------
//var sys = require('sys');
var sys = require('util');
var opt = require('getopt');
var path = require('path');
var fs = require('fs');
var mongodb = require('mongodb');
var jsdom   = require('jsdom').jsdom;
var sync = require('synchronize');

//----------------------------------------------
// Definitions
//----------------------------------------------
var MEM_THRESHOLD = 500*1024*1024; // byte
var DATA_DIR = __dirname + '/data';

//---------------
// Environments
process.chdir(__dirname);
var common = require(__dirname + '/lib/common.js');
common.mkdirp(DATA_DIR);

ST_QUEUED = 0
ST_PROCESSING = 1
ST_DONE = 2
ST_ERROR = -1

//----------------------------------------------
// Options
//----------------------------------------------
var JQUERY  = './lib/jquery-1.11.3.min.js';
var WORKER  = null;
var JOBS    = 1;
var LOGLV   =  6;
var FILE    = null;
var INPUT =null;
var OUTPUT=null
var RESUME  = null;
var CREATEJOB=null;
var CONF    = null;

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
  sys.puts('   -o <node>      : MongoDB instance as output   > 172.0.0.1:27017/db.col');
  sys.puts('   -m <node>      : MongoDB instance as input    > 127.0.0.1:27017/db.col');
  sys.puts('   -c <conf-file> : Config file');
  sys.puts('   -C             : Create new job');
  sys.puts('   -j <number>    : # Job process');
  process.exit(a);
}

try {
  opt.setopt('hl:f:o:m:c:Cj:W',process.argv);
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
      INPUT = ''+p;
      break;
      case 'c':
      CONF = ''+p;
      break;
      case 'o':
      OUTPUT = ''+p;
      break;
      case 'C':
      CREATEJOB = true;
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

var SETTING = {
  FIELDS : {
    body: 'body'
  }
}
if ( CONF ) {
  SETTING = require(path.resolve(CONF)).get();
}
SETTING.FILE = common.cond_default(FILE, SETTING.FILE);
SETTING.MODIFY = common.cond_default(SETTING.MODIFY, function (ret) { return ret; });

if (OUTPUT) {
  var mongo = common.parse_mongo(OUTPUT);
  SETTING.DST = {
    host: mongo.host,
    port: mongo.port,
    dbname: mongo.dbname,
    colname: mongo.colname,
    user: null,
    pass: null,
    authdbname: null,
  };
}

if (INPUT) {
  var mongo = common.parse_mongo(INPUT);
  SETTING.SRC = {
    host: mongo.host,
    port: mongo.port,
    dbname: mongo.dbname,
    colname: mongo.colname,
    fieldname: 'body',
    query: {},
    user: null,
    pass: null,
    authdbname: null,
  };
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
    if ( SETTING.DST.authdbname ) {
      this.authdb = new mongodb.Db(
        SETTING.DST.authdbname,
        mongodb.Server(SETTING.DST.host,SETTING.DST.port),
        { safe:true}
      );
      sync.await(this.authdb.open(sync.defer()));
      sync.await(this.authdb.authenticate(SETTING.DST.user, SETTING.DST.pass, sync.defer()));
      this.db = this.authdb.db(SETTING.DST.dbname);
    } else {
      this.db = new mongodb.Db(
        SETTING.DST.dbname,
        mongodb.Server(SETTING.DST.host,SETTING.DST.port),
        { safe:true}
      );
      sync.await(this.db.open(sync.defer()));
    }
    this.col = this.db.collection(SETTING.DST.colname);
  }
  MongoOut.prototype.out = function(ret){
    log.message(ret._id,'mongoout','','');
    ret.res  = 'success'
    ret.ts  = new Date().getTime();
    this.col.save(ret,function(){});
  }
  MongoOut.prototype.err = function(id,reason){
    log.error(id,'error','','');
    var ret = {};
    ret._id = id;
    ret.res  = 'error';
    ret.ts  = new Date().getTime();
    this.col.save(ret,function(){});
  }
  MongoOut.prototype.drop = function(){
    log.message('== drop ==','mongoout','','');
    try {
      sync.await(this.col.drop(sync.defer()));
    }catch(e){
    }
  }
  if ( SETTING.DST ) {
    out = new MongoOut();
  }

  function HtmlPicker(){
  }
  HtmlPicker.prototype.pick = function (html,fields,done){
    if ( ! done ) {
      done = function(){}
    }
    try {
      if ( ! html ) {
        throw 'Empty contents'
      }
      jsdom.env({
        html: html,
        scripts: [path.resolve(__dirname, JQUERY)],
        done: function (errors, window) {
          var $ = window.$;
          try {
            $('script').text('');
            $('style').text('');
            var result = {}
            for ( var field in fields ) {
              if ( !result[field] ) {
                result[field] = ''
              }
              var selector = fields[field];
              $(selector).text().split("\n").forEach(function(l){
                var line = l.replace(/^\s+/,'').replace(/\s+/m,' ');
                if ( line && line != ' ' ) {
                  result[field] += line;
                }
              });
            }
            done(null, result);
          }catch(e){
            done(e);
          }
        }
      });
    }catch(e){
      done(e);
    }
  }

  var P = new HtmlPicker();
  if ( SETTING.SRC ) {
    fromMongo();
    return;
  }

  if ( SETTING.FILE ) {
    fromFile();
    return;
  }
  fromStdIn();


  function picktext(id, html, done){
    P.pick(html, SETTING.FIELDS, function(err, ret){
      if ( err ) {
        out.err(id, err);
      } else {
        ret._id = id;
        ret = SETTING.MODIFY(ret);
        out.out(ret);
      }
      done(err, id);
    });
  }

  function fromMongo(){
    log.echo(SETTING.SRC.colname,'=== START (MONGO) ===', SETTING.SRC.dbname);
    sync.fiber(function(){
      var db = null;
      try {
        if ( SETTING.SRC.authdbname ) {
          var authdb = new mongodb.Db(
            SETTING.SRC.authdbname,
            mongodb.Server(SETTING.SRC.host,SETTING.SRC.port),
            { safe:true}
          );
          sync.await(authdb.open(sync.defer()));
          sync.await(authdb.authenticate(SETTING.SRC.user, SETTING.SRC.pass, sync.defer()));
          db = authdb.db(SETTING.SRC.dbname);
        } else {
          db = new mongodb.Db(
            SETTING.SRC.dbname,
            mongodb.Server(SETTING.SRC.host,SETTING.SRC.port),
            { safe:true}
          );
          sync.await(db.open(sync.defer()));
        }

        var col = db.collection(SETTING.SRC.colname);
        var job = db.collection(SETTING.DST.colname + '.job');
        if ( CREATEJOB ) {
          out.drop();
          try {
            sync.await(job.drop(sync.defer()));
          }catch(e){
          }
          try {
            var cursor = sync.await(col.find(SETTING.SRC.query, {_id: 1}, sync.defer()));
            var count = sync.await(cursor.count(sync.defer()));
            var fcount = 0;
            cursor.each(function(e,obj){
              if ( ! (obj && '_id' in obj) ){
                cursor.close();
                return;
              }
              obj.st = ST_QUEUED;
              job.insert(obj,function(){fcount++;});
            });
            var interval = setInterval(function(){
              sync.fiber(function(){
                if ( fcount == count ) {
                  clearInterval(interval);
                  sync.await(job.ensureIndex({st: 1},sync.defer()));
                  log.echo(SETTING.SRC.colname,'=== CREATEJOB (MONGO) ===',fcount);
                  setTimeout(function(){
                    db.close();
                    process.exit(0);
                  },500);
                }
              });
            },1000);
          }catch(e){
            log.error(SETTING.SRC.colname,e,'');
            process.exit(0);
          }
          return;
        }
        while (true ){
          var m = process.memoryUsage();
          if (  TERM_FLG  || m.heapUsed >  MEM_THRESHOLD ) {
            log.echo('=== Interrupt ===',m.heapUsed + ' > ' + MEM_THRESHOLD,SETTING.SRC.colname);
            setTimeout(function(){
              db.close();
              process.exit(2);
            },3000);
            return;
          }
          var prev = sync.await(job.findAndModify(
            {st: ST_QUEUED},
            {},
            {'$set':{st: ST_PROCESSING}},
            {},
            sync.defer())).value;
          if ( !(prev && '_id' in prev) ) {
            setTimeout(function(){
              log.echo('=== END (MONGO) ===','No job',SETTING.SRC.colname);
              db.close();
              process.exit(0);
            },3000);
            return;
          }
          var filter = {};
          filter[SETTING.SRC.fieldname] = 1;
          var doc = sync.await(col.findOne({_id:prev._id},filter,sync.defer()));
          picktext(doc._id,doc[SETTING.SRC.fieldname],function(err, id){
            if ( err ) {
              job.update({_id:id},{'$set':{st: ST_ERROR}},function(){});
            }else{
              job.update({_id:id},{'$set':{st: ST_DONE}},function(){});
            }
          });
        }
      }catch(e){
        log.error(SETTING.SRC.colname,e,'');
        process.exit(0);
      }
    });
  }
  function fromFile(){
    log.echo(SETTING.FILE,'=== START (FILE) ===');
    var html = fs.readFileSync(SETTING.FILE);
    picktext(SETTING.FILE,html);
    setTimeout(function(){
      process.exit(0);
    },5000);
  }
  function fromStdIn(){
    log.echo('STDIN','=== START (STDIN) ===');
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
        picktext(json._id,line);
      }
      return ret;
    }
    var html = '';
    process.stdin.on('data',function(chunk){
      html += chunk;
      html = procline(html,false);
    });
    process.stdin.on('end',function(){
      procline(html,true);
      setTimeout(function(){
        process.exit(0);
      },5000);
    });
  }
});
