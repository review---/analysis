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
var html = '';
if ( FILE ) {
	html = fs.readFileSync(FILE);
	gettext(FILE,html);
	return;
}
process.stdin.on('data',function(chunk){
	html += chunk;
	if ( MULTI ) {
		html = procline(html,false);
	}
});
process.stdin.on('end',function(){
	if ( MULTI ) {
		procline(html,true);
		return;
	}
	var json = JSON.parse(html);
	gettext(json._id,json.body);
});
return;

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
		gettext(json._id,json.body);
	}
	return ret;
}
function gettext(id,body){
	if ( ! body ) {
		process.eputs('=== NO BODY ! ===' );
		process.exit(1);
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
				var ret = { _id : id , body: text };
				sys.puts(JSON.stringify(ret));
				//sys.puts('{ _id:'+id+',body:"'+text+'"}');
			}else{
				sys.puts('{body:"'+text+'"}');
			}
		}catch(e){
			process.eputs(e);
			process.exit(1);
		}
	}); // jquery-1.4.4.js
}
