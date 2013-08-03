//var sys    = require('util');

var common = require(__dirname + '/common.js');
var jsdom   = require('jsdom').jsdom;
var sync = require('synchronize');

var JQUERY  = '../jquery-1.4.4.js';

process.eputs = function(str){
  process.stderr.write(str+'\n');
}

function HtmlPicker(out){
	this.out = out;
}
HtmlPicker.prototype.pick = function (id,body,conds,end){
	var out = this.out;
	if ( ! end ) {
		end = function(){}
	}
	if ( ! body ) {
		process.eputs('=== NO BODY ! ===' );
		process.eputs(id['$oid']);
		return;
	}
	try { 
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
			sync.fiber(function(){
				try {
						$('script').text('');
						$('style').text('');
					var text ='';
					for ( var i in conds ) {
						var cond = conds[i];
							$(cond).text().split("\n").forEach(function(l){
								var line = l.replace(/^\s+/,'').replace(/\s+/m,' ');
								if ( line && line != ' ' ) {
									text += line;
								}
							});
						
					}
					var ret = { _id : id , body: text };
					out.out(ret);
					end(id,ret);
				}catch(e){
					out.err(id,e);
					end(id);
				}
			}); // sync.fiber
		}); // jquery-1.4.4.js
	}catch(e){
		out.err(id,e);
		end(id);
	}
}

exports.html_picker = function(out) {
	return new HtmlPicker(out);
}
