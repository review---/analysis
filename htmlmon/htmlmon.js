#!/usr/bin/env node

process.eputs = function(str){
  process.stderr.write(str+'\n');
}

//----------------------------------------------
// Node modules
//----------------------------------------------
//var sys = require('sys');
var sys = require('util');
var sync = require('synchronize');
var opt = require('getopt');
var crypto  = require('crypto');
var fs = require('fs');
var path = require('path');
var url = require('url');
var jsdom   = require('jsdom').jsdom;
var request = require('request');
var iconv   = require('iconv');
//----------------------------------------------
// Definitions
//----------------------------------------------
var MEM_THRESHOLD = 700*1024*1024; // byte
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
var LOGLV   =  6;
var PROXY   = null;
var SSLPROXY= null;
var TIMEOUT = null;
var WAIT    = null;
var STDTEST = null;
var URL     = null;
var TEST_NAME = null;
var CONF    = null;
var JQUERY  = './lib/jquery-1.11.3.min.js';
var RESUME  = null;
var ERROR_RECOVERY  = null;
var VERBOSE = null;
var PARALLEL= 1;
var APPEND  = null;
var MONGO_NODE='127.0.0.1:27017/htmlmon';

function help(a){
  sys.puts('Usage:');
  sys.puts('   node htmlmon.js -u <url>       [-p <proxy>] [-l loglv] [-q <jquery>]');
  sys.puts('   node htmlmon.js -c <conf-file> [-p <proxy>] [-l loglv] [-q <jquery>]');
  sys.puts('Options:');
  sys.puts('   -l <loglv>     : Specify the loglv from 0 to 20 ( 6 is defalut )');
  sys.puts('   -p <proxy>     : Specify the http-proxy-url ( for example -p http://proxy.example.com:8080 )');
  sys.puts('   -s <ssl-proxy> : Specify the https-proxy-url ( for example -p http://proxy.example.com:8080 )');
  sys.puts('   -t <timeout>   : Specify the http timeout (msec)');
  sys.puts('   -w <wait>      : Specify the request wait (msec)');
  sys.puts('   -B             : Simple body fetch test mode');
  sys.puts('   -T             : Standerd test mode');
  sys.puts('   -F             : Standerd test (with fetching body) mode');
  sys.puts('   -S             : Standerd test (with fetching body , parsing style) mode');
  sys.puts('   -C             : Crawl test mode');
  sys.puts('   -N <name>      : Specify the TSET_NAME ');
  sys.puts('   -u <url>       : Specify the target-url ');
  sys.puts('   -c <conf-file> : Specify the config file path');
  sys.puts('   -q <jquery>    : Specify the jquery file ( jquery-1.4.4.js is default )');
  sys.puts('   -j <number>    : Specify the number of the parallel download ( 1 is default )');
  sys.puts('   -R             : Resume mode. if you want to resume prior WATCH is interrupted by anything');
  sys.puts('   -E             : Resume with error recovery. Specify with -R');
  sys.puts('   -V             : Verbose log if you want to preserve all contents');
  sys.puts('   -M             : MongoDB instance > 127.0.0.1:27017/htmlmon');
  sys.puts('   -A             : Append fetch');
  process.exit(a);
}

try {
  opt.setopt('hl:p:s:u:N:w:t:c:j:q:BTFSCREVAM:W',process.argv);
  opt.getopt(function ( o , p ){
    switch (o) {
    case 'h':
      help(0);
      break;
    case 'l':
      LOGLV = p[0];
      break;
    case 'p':
      PROXY = p[0];
      break;
    case 's':
      SSLPROXY = p[0];
      break;
    case 't':
      TIMEOUT = p[0];
      break;
    case 'w':
      WAIT = p[0];
      break;
    case 'B':
      STDTEST   = 'BSTD';
      break;
    case 'T':
      STDTEST   = 'STD';
      break;
    case 'F':
      STDTEST   = 'FSTD';
      break;
    case 'S':
      STDTEST   = 'CSTD';
      break;
    case 'C':
      STDTEST   = 'CRAWL';
      break;
    case 'u':
      if ( p.length === 1) {
        URL = p[0];
      }else{
        URL = p;
      }
      break;
    case 'N':
      TEST_NAME = p[0];
      break;
    case 'c':
      CONF = p[0];
      break;
    case 'q':
      JQUERY = p[0];
      break;
    case 'j':
      PARALLEL = p[0];
      break;
    case 'R':
      RESUME = 1;
      break;
    case 'E':
      ERROR_RECOVERY = 1;
      break;
    case 'V':
      VERBOSE = 1;
      break;
    case 'A':
      APPEND = 1;
      break;
    case 'M':
      MONGO_NODE = p[0];
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

var stdtest = require( __dirname + '/lib/stdtest.js');

var mongo = common.parse_mongo(MONGO_NODE);
var SETTING = {
  URL      : null,
  PROXY    : null,
  SSLPROXY : null,
  TIMEOUT  : 5000,
  WAIT     : 1000,
  TEST     : stdtest.STATUS_TEST,
  VERBOSE  : null,
  PARALLEL : 1,
  USECOOKIE: true,
  MONGO: {
    host: mongo.host,
    port: mongo.port,
    dbname: mongo.dbname,
    user: null,
    pass: null,
    authdbname: null,
  },
}

if ( CONF ) {
  SETTING = require(path.resolve(CONF)).get();
}
// Override member on config
SETTING.TEST_NAME = common.cond_default(TEST_NAME,SETTING.TEST_NAME);;
SETTING.URL     =common.cond_default(URL,SETTING.URL);
SETTING.PROXY   =common.cond_default(PROXY,SETTING.PROXY);
SETTING.SSLPROXY=common.cond_default(SSLPROXY,SETTING.SSLPROXY);
SETTING.TIMEOUT =common.cond_default(TIMEOUT,SETTING.TIMEOUT);
SETTING.WAIT    =common.cond_default(WAIT,SETTING.WAIT);
SETTING.TEST    =(STDTEST==='BSTD')?   stdtest.FETCH_TEST     :SETTING.TEST;
SETTING.TEST    =(STDTEST==='STD')?    stdtest.STD_TEST       :SETTING.TEST;
SETTING.TEST    =(STDTEST==='FSTD')?   stdtest.FSTD_TEST      :SETTING.TEST;
SETTING.TEST    =(STDTEST==='CSTD')?   stdtest.CSTD_TEST      :SETTING.TEST;
SETTING.TEST    =(STDTEST==='CRAWL')?  stdtest.STD_CRAWL_TEST :SETTING.TEST;
SETTING.VERBOSE =common.cond_default(VERBOSE,SETTING.VERBOSE);
SETTING.PARALLEL=common.cond_default(PARALLEL,SETTING.PARALLEL);

//---------------
// Validate
if ( ! SETTING.URL ) {
  process.eputs('=== NO URL ! ===' );
  help(1);
}

//---------------
// Test name
var md5sum = crypto.createHash('md5');
SETTING.TEST_NAME = common.cond_default(SETTING.TEST_NAME,md5sum.update(JSON.stringify(SETTING)).digest('hex'));
var LOG   = DATA_DIR + '/' + SETTING.TEST_NAME + '.log';
var log = require( __dirname + '/lib/log.js').log(LOG,LOGLV).init();

var F   = require( __dirname + '/lib/fetch_list.js').fetch_list(SETTING.MONGO, SETTING.TEST_NAME+'.q');
var L   = require( __dirname + '/lib/fetch_logger.js').fetch_logger(SETTING.MONGO, SETTING.TEST_NAME);

if ( VERBOSE ) {
  SETTING.FETCH_BODY = true;
}
if (! SETTING.FETCH_BODY) {
  L = {
    init: function(){},
    status: function(){},
    header: function(){},
    body: function(){}
  };
}

var C   = require( __dirname + '/lib/fetch_cookie.js').fetch_cookie(SETTING.MONGO, SETTING.TEST_NAME+'.c');
if ( !SETTING.USECOOKIE ){
  C = {
    init: function(){},
    get: function(){},
    store: function(){},
  };
}

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
      log.echo(SETTING.URL,'Wait child ',code);
      if ( code === 2 && !TERM_FLG ) {
        fork_worker();
      }
    }); // sync.fiber
  });
}


var TERM_FLG = false; // signal flag
//----------------------------------------------
// Control process ( parent )
//----------------------------------------------
if ( ! WORKER ) {
  var child_process  = require('child_process');
  var cmd = process.argv.shift();

  var child_argv = process.argv.concat();
  child_argv.push('-W');


  process.on('SIGINT', function () {
    process.eputs('SIGINT Received !');
    TERM_FLG = true;
  });

  fork_worker();
  child_argv.push('-R');
  for ( var i in child_argv ){
    if ( child_argv[i] === '-E' ) {
      child_argv[i] = '';
    }
  }
  return;
}



//----------------------------------------------
// Worker process ( child )
//----------------------------------------------
process.on('SIGINT', function () {
  TERM_FLG = true;
});


function do_worker(){
  //---------------
  // Resume mode
  if ( RESUME ) {
    F.init();
    C.init();
    L.init();
    if ( ERROR_RECOVERY ){
      F.resetError();
      log.echo(SETTING.URL,'=== RESET ERRORS ===',SETTING.TEST_NAME );
    }
    log.echo(SETTING.URL,'=== CONTINUE ===',SETTING.TEST_NAME);
  }else{
    F.init(true);
    C.init(true);
    if ( APPEND ) {
      L.init();
    }else{
      L.init(true);
    }
    if ( typeof SETTING.URL === 'string' ) {
      F.queuing(SETTING.URL,SETTING.TEST);
    }else{
      for ( var i in SETTING.URL ) {
        F.queuing(SETTING.URL[i],SETTING.TEST);

      }
    }
    log.echo(SETTING.URL,'=== START ===',SETTING.TEST_NAME);
  }

  //---------------
  // Fetch loop
  try {
    log.echo('<URL>','<VAL>','<MSG>','<REFERER>');
    function add_queue ( url , resh , test , referer ) {
      try{
        var q = F.queuing(url,test,referer);
        if ( q ) {
          log.message(url, referer, 'skip queuing');
          return;
        } else {
          log.message(url, referer, 'queuing');
        }
        //setTimeout(loop,SETTING.WAIT); // Wait for fetching
      }catch(e){
        log.error('=======================','LOOP','catch',e.stack);
      }
    }
    var loopInterval = null;
    var termTimeout = null;
    function loop (){
      sync.fiber(function(){
        try {
          // memory check
          var m = process.memoryUsage();
          if (  TERM_FLG  || m.heapUsed >  MEM_THRESHOLD ) {
            var exit = function () {
              log.echo('=== Interrupt ===',m.heapUsed + ' > ' + MEM_THRESHOLD,SETTING.TEST_NAME);
              process.exit(2);
            }
            var remains = F.target_count() - F.queuing_count();
            if ( ! remains ){
              exit();
            }
            if ( ! termTimeout ){
              termTimeout=setTimeout(function(){
                exit();
              },SETTING.TIMEOUT);
            }
            if ( loopInterval ){
              clearInterval(loopInterval);
              loopInterval = null;
            }
            return;
          }
          if ( ! F.target_count() ) {
            log.echo(SETTING.URL,'=== FINISH ===',SETTING.TEST_NAME);
            process.exit(0);
          }
          for( var i = 0; i < SETTING.PARALLEL; i++ ) {
            if ( F.fetching_count() < SETTING.PARALLEL ){
              var q = F.fetching();
              if ( q ) {
                log.echo(q._id,Math.floor(m.heapUsed/(1024*1024)*100)/100 + ' / ' + Math.floor(m.heapTotal/(1024*1024)*100)/100 + ' (MB)','Q:' + F.queuing_count() + '  F:' + F.fetching_count());
                fetch_content(q._id,q.headers,q.test,q.referer,add_queue);
              }
            }else{
              break;
            }
          }
        }catch(e){
          log.error('=======================','LOOP','catch',e.stack);
        }
      });
    }
    if ( !loopInterval ){
      loopInterval = setInterval(loop,SETTING.WAIT);
    }
  }catch ( e ) {
    log.error(SETTING.URL,'LOOP','catch',e.stack);
    return;
  }
  return;
}
sync.fiber(function(){
  do_worker();
});

//-----------------------------------
//
//-----------------------------------

function fetch_content(strurl,reqHeaders,TEST,referer,callback) {
  var parsed = url.parse(strurl);
  if ( TEST.ON_ERROR === undefined ) {
    TEST.ON_ERROR = stdtest.NULL_ON_ERROR;
  }
  if ( reqHeaders === undefined ) {
    reqHeaders = {};
  }
  reqHeaders['Pragma']        = 'no-cache';
  reqHeaders['Cache-Control'] = 'no-cache';
  if ( ! reqHeaders['Accept'] ) {
    reqHeaders['Accept']        = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
  }
  if ( ! reqHeaders['User-Agent'] ) {
    reqHeaders['User-Agent']    = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0';
  }
  if ( ! reqHeaders['Accept-Language'] ) {
    reqHeaders['Accept-Language'] = 'ja,en-us;q=0.7,en;q=0.3';
  }
  var cookie = C.get(parsed.protocol,parsed.hostname,parsed.path);
  if ( cookie ) {
    reqHeaders['Cookie'] = common.cond_default(reqHeaders['Cookie'],'');
  }
  if ( referer ){
    reqHeaders['Referer'] = referer;
  }
  log.trace(strurl,'TRY');

  var rpath = parsed.pathname+common.cond_default(parsed.search,'');

  //  var j = request.jar();
  //  j.add(request.cookie(reqHeaders['Cookie']));

  var req_options = {
    uri: strurl,
    headers : reqHeaders,
    timeout: SETTING.TIMEOUT,
    encoding: null
  };
  var req = request( req_options , function ( error , res , body ) {
    sync.fiber(function(){
      try {
        if ( error ) {
          if ( error.code === 'ETIMEDOUT' ) {
            if ( F.timeout(strurl) ) {
              log.error(strurl,'' + SETTING.TIMEOUT + ' (ms)','TIMEOUT');
              TEST.ON_ERROR('TIMEOUT',strurl,'' + SETTING.TIMEOUT + ' (ms)','TIMEOUT');
              return;
            }
          }else{
            // error.code === 'ECONNREFUSED'
            log.error(strurl,'HTTP ERROR',error.code);
            TEST.ON_ERROR('REQUEST',strurl,'HTTP ERROR',error.code);
          }
          F.error(strurl);
          return;
        }
        // Status code
        log.status(strurl,res.statusCode,'STATUS');
        F.status_code(strurl,res.statusCode);
        L.status(strurl,res.statusCode);
        L.header(strurl,res.headers);
        if ( ! (res.statusCode in  TEST.STATUS) ){
          F.error(strurl);
          log.error(strurl,res.statusCode,'BAD STATUS');
          TEST.ON_ERROR('RESPONSE : ',strurl,res.statusCode,'BAD STATUS');
          return;
        }
        C.store(parsed.hostname, parsed.path, res.headers['set-cookie']);

        if ( res.statusCode === 302 || res.statusCode === 301 ) {
          F.skip_fetching(strurl,'REDIRECT');
          var location = url.resolve(strurl,res.headers['location']);
          log.trace(location,'LOCATION');
          if ( strurl === location ) {
            F.skip_fetching(strurl,'CIRCULAR LOCATION');
            log.error(strurl,location,'CIRCULAR LOCATION');
            TEST.ON_ERROR('REDIRECT',strurl,location,'CIRCULAR LOCATION');
            return;
          }
          if ( do_filter('REDIRECT',location,TEST.REDIRECT.FILTER) ){
            callback(location,res.headers,TEST,strurl);
            F.skip_fetching(strurl,'REDIRECT');
            return;
          }
          return;
        }
        if ( TEST.CHECKS.length === 0 && ! SETTING.FETCH_BODY){
          F.skip_fetching(strurl,'STATUS ONLY');
          log.ok(strurl,res.statusCode,'status ok');
          return;
        }
        // Body
        log.debug('RESPONSE:'+strurl,res);
        if ( ! body ) {
          F.error(strurl);
          log.error(strurl,content_type,'NO BODY',res.statusCode);
          TEST.ON_ERROR('BODY',strurl,content_type,'NO BODY',res.statusCode);
          return;
        }

        var content_type = res.headers['content-type'];
        var match = /^text.+charset=(.+)$/.exec(content_type);
        if ( !match ) {
          match = /Content-Type[^>]+charset=([^"> ]+)"/i.exec(body);
        }
        if ( match ) {
          var charset = match[1];
          if ( /windows.?31j/i.test(charset)) {
            charset = 'CP932'
          }
          if ( charset && charset !== 'utf-8' ) {
            conv = new iconv.Iconv(charset,'UTF-8//TRANSLIT//IGNORE');
            body = conv.convert(body);
          }
        }
        body = body.toString();

        L.body(strurl,res.statusCode,res.headers,body);
        F.fetched(strurl,content_type,body.length);

        if ( ! /html/.test(content_type) || TEST.CHECKS.length === 0 ) {
          F.end(strurl);
          log.ok(strurl,content_type,'fetch ok');
          return;
        }

        try {
          checkup_html(strurl,res.headers,body,TEST,callback);
        }catch(e){
          F.error(strurl);
          log.error(strurl,content_type,'INVALID HTML',e.stack);
          TEST.ON_ERROR('INVALID HTML',strurl,content_type,'INVALID HTML',e);
        }
      }catch(e){
        F.error(strurl);
        log.error(strurl,res.statusCode,'INVALID HTTP',e.stack);
        TEST.ON_ERROR("HTTP_ERROR",strurl,res.statusCode,'INVALID HTTP',e);
      }
    }); // sync.fiber
  });

  function do_filter ( pre, target , FILTER ) {
    for ( var i in FILTER.ERROR ) {
      if ( RegExp(FILTER.ERROR[i]).test(target) ) {
        log.error(strurl,FILTER.ERROR[i],pre+' >BAD JUMP',target);
        TEST.ON_ERROR(pre,strurl,FILTER.ERROR[i],pre+' >BAD JUMP',target);
        return false;
      }
    }

    for ( var i in FILTER.IGNORE ) {
      if ( RegExp(FILTER.IGNORE[i]).test(target) ) {
        log.message(strurl,FILTER.IGNORE[i],pre+' >(ignore)',target);
        return false;
      }
    }

    for ( var i in FILTER.FOLLOW ) {
      if ( RegExp(FILTER.FOLLOW[i]).test(target) ) {
        return true;
      }
    }
    if ( FILTER.INNER_DOMAIN ) {
      var preq = url.parse(target);
      if ( preq.host === parsed.host ) {
        return true;
      }
    }
    log.message(strurl,'-',pre+' >(unmatch)',target);
    return false;
  }


  function checkup_html(strurl,res_headers,body,TEST,callback){

    jsdom.env({
      html: body,
      scripts: [path.resolve(__dirname, JQUERY)],
      done: function (errors, window) {
        var $ = window.$;
        function uniq( arr ) {
          var buf = {};
          return arr.filter(function (e){
            if ( buf[e] ) {
              return false;
            }
            buf[e] = true;
            return true;
          });
        }

        function uniq_links( elements, links ) {
          if ( ! links ){
            links = [];
          }
          var re = /#.*$/;
          elements.each( function(){
            var href = $(this).attr('href');
            if ( href ) {
              var link = href.replace(re,'');
              links.push(url.resolve(strurl,link));
              //            links.push(url.resolve(strurl,encodeURI(link)));
            }
            var src = $(this).attr('src');
            if ( src ) {
              var link = src.replace(re,'');
              links.push(url.resolve(strurl,link));
              //            links.push(url.resolve(strurl,encodeURI(link)));
            }
          });
          return uniq(links).sort().reverse();
        }
        function uniq_css_links( elements, links ) {
          if ( ! links ){
            links = [];
          }
          var re = /\s*url\s*\("?([^)]*?)"?\)/ig;
          function css_links(text){
            re.lastIndex = null;
            for (;;){
              var matches = re.exec(text)
              if ( ! matches ) {
                break;
              }
              links.push(url.resolve(strurl,matches[1]));
              //            links.push(url.resolve(strurl,encodeURI(matches[1])));
            }
          }
          elements.each(function (){
            if ( $(this).is('style') ) {
              var children = $(this).get(0).childNodes;
              for (var i in children ) {
                var text = children[i].nodeValue;
                css_links(text);
              }
            }else{
              if ( $(this).attr('style') ) {
                css_links($(this).attr('style'));
              }
            }
          });
          return uniq(links).sort().reverse();
        }
        sync.fiber(function(){
          try{
            for( var i in TEST.CHECKS ) {
              try {
                var CHECK = TEST.CHECKS[i];
                if ( CHECK.METHOD == 'HOOK' ) {
                  try {
                    var msg = CHECK.HOOK(TEST,strurl,referer,$);
                    if ( msg  ) {
                      log.message(strurl,'HOOK','interrupt by hook',msg);
                      return;
                    }
                  }catch(e){
                    log.error(strurl,'','HOOK error',e.stack);
                  }
                  log.ok(strurl,referer,'callback');
                }else if ( CHECK.METHOD == 'CRAWL' ) {
                  log.ok(strurl,referer,'crawl ok');
                  var links = [];
                  for ( var s in CHECK.SELECTORS ) {
                    links = uniq_links($(CHECK.SELECTORS[s]),links);
                  }
                  for ( var l in links ) {
                    if ( do_filter('CRAWL',links[l],CHECK.FILTER )){
                      callback(links[l],res_headers,TEST,strurl);
                    }
                  }
                } else {
                  var elements = $(CHECK.SELECTOR);
                  log.debug('CHECK('+CHECK.METHOD+')',CHECK.SELECTOR);
                  if ( CHECK.METHOD == 'EXIST' ) {
                    var size = elements.size();
                    if ( size === 0 ) {
                      throw [CHECK.METHOD,strurl,CHECK.SELECTOR,'ELEMENT NOT FOUND','(not found)'];
                    }else {
                      log.ok(strurl,CHECK.SELECTOR,'exist ok','');
                    }
                  }else if ( CHECK.METHOD == 'NOT_EXIST' ) {
                    var size = elements.size();
                    if ( size !== 0 ) {
                      throw [CHECK.METHOD,strurl,CHECK.SELECTOR,'UNEXPECTED ELEMENT FOUND',{Actual:elements.html()}];
                    }else {
                      log.ok(strurl,CHECK.SELECTOR,'not exist ok','');
                    }
                  }else if ( CHECK.METHOD == 'TEXT' ) {
                    var text = elements.text();
                    if ( ! RegExp(CHECK.EXPECTS).test(text) ) {
                      throw [CHECK.METHOD,strurl,CHECK.SELECTOR,'TEXT UNMATCH',{Expects:CHECK.EXPECTS,Actual:text}];
                    }else {
                      log.ok(strurl,CHECK.SELECTOR,'text ok');
                    }
                  }else if ( CHECK.METHOD == 'LINK' ) {
                    var links = uniq_links(elements);
                    for ( var l in links ) {
                      if ( do_filter('LINK',links[l],CHECK.FILTER )){
                        callback(links[l],res_headers,CHECK.TEST,strurl);
                      }
                    }
                  }else if ( CHECK.METHOD == 'CSS' ) {
                    var links = uniq_css_links(elements);
                    for ( var l in links ) {
                      if ( do_filter('LINK',links[l],CHECK.FILTER )){
                        callback(links[l],res_headers,CHECK.TEST,strurl);
                      }
                    }
                  }else{
                    throw [CHECK.METHOD,strurl,CHECK.METHOD,'UNKNOWN CHECK',''];
                  }
                }
              }catch(e){
                sys.puts('=============================');
                sys.puts(e);
                log.error(e[0],e[1],e[2],e[3]);
                TEST.ON_ERROR(e[0],e[1],e[2],e[3],e[4]);
              }
            } // for TEST.CHECKS
            F.end(strurl);
          }catch(e){
            log.error(strurl,'jQueryify','Fatal error',e.stack);
            F.error(strurl);
          }
          window.close();
        }); // sync.fiber
      }
    });
  }
}
