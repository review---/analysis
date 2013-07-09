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
var crypto  = require('crypto');
var fs = require('fs');
var path = require('path');
var url = require('url');
//var querystring = require('querystring');
var http    = require('http');
var https   = require('https');
var jsdom   = require('jsdom').jsdom;

//----------------------------------------------
// Definitions
//----------------------------------------------
var MEM_THRESHOLD = 300*1024*1024; // byte
//var MEM_THRESHOLD = 10*1024*1024; // byte

//---------------
// Environments
process.chdir(__dirname);

//----------------------------------------------
// Options
//----------------------------------------------
var FILE    = null;
var MULTI   = false;
var JQUERY  = 'jquery-1.4.4.js';
function help(a){
  sys.puts('Usage:');
  sys.puts('   node parsehtml.js [-f <inputfile>]');
  sys.puts('Options:');
  sys.puts('   -f <inputfile>     : Specify htmlfile otherwise read html from STDIN');
  process.exit(a);
}

try {
  opt.setopt('hf:m',process.argv);
  opt.getopt(function ( o , p ){
    switch (o) {
      case 'h':
      help(0);
      break;
      case 'f':
      FILE = ''+p;
      break;
      case 'm':
      MULTI = true
      break;
    }
  });
}catch ( e ) {
  process.eputs('Invalid option ! "' + e.opt + '" => ' + e.type);
  help(1);
}

//---------------
// Validate 
var body = '';
if ( FILE ) {
	body = fs.readFileSync(FILE);
	gettext('"'+FILE+'" '+body);
	return;
}
process.stdin.on('data',function(chunk){
	body += chunk;
	if ( MULTI ) {
		body = procline(body,false);
	}
});
process.stdin.on('end',function(){
	if ( MULTI ) {
		procline(body,true);
		return;
	}
	gettext(body);
});
return;

function procline(line,end){
	var bodies = line.split("\n");
	var ret;
	if ( ! end ) {
		ret = bodies.pop();
	}
	for ( var b in bodies ) {
		var body = bodies[b];
		if ( ! body ) {
			continue;
		}
		gettext(body);
	}
	return ret;

}
function gettext(body){
	if ( ! body ) {
		process.eputs('=== NO BODY ! ===' );
		process.exit(1);
	}
	var id = null;
	var matches;
	if ( matches = body.match(/^(\S+)\s+</) ) {
		id = matches[1];
		body = body.substring(id.length);
	}
	var document = jsdom(body,null,{
		features:{
		FetchExternalResources : false,
			ProcessExternalResources : false,
				"MutationEvents"           : '2.0',
				"QuerySelector"            : false
		}
	});
	var window = document.createWindow();
	jsdom.jQueryify(window, JQUERY, function (window, $) {
		try {
			$('script').text('');
			$('style').text('');
			var text ='';
				$('body').text().split("\n").forEach(function(l){
					var line = l.replace(/^\s+/,'').replace(/\s+/m,' ');
					if ( line && line != ' ' ) {
						text += line.split('"').join('\\"')  + '\\n';
					}
				});
			if ( id ) {
				sys.puts('{ _id:'+id+',body:"'+text+'"}');
			}else{
				sys.puts('{body:"'+text+'"}');
			}
		}catch(e){
			process.eputs(e);
			process.exit(1);
		}
	}); // jquery-1.4.4.js
}
