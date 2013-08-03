//var sys = require('sys');
var sys = require('util');
var fs  = require('fs');
var log     = require( __dirname + '/lib/log.js');
var stdtest = require( __dirname + '/lib/stdtest.js');
// all page
exports.get = function() { 
  return {
    TEST_NAME: 'news-infoseek-topics',
    URL      : 'http://news.infoseek.co.jp/topics/',
    PROXY    : null, // <host>:<port>
    SSLPROXY : null, // Not supported
    TIMEOUT  : 30000, // msec
    WAIT     : 10,  // msec
    TEST : { 
      ON_ERROR : function on_error(pref,strurl,selector,msg,data){
	// log.error(strurl,selector,'HOOK error',msg);
      },
      STATUS   : stdtest.DEFAULT_CHECK_STATUS,
      REDIRECT : {
				FILTER : stdtest.DEFAULT_FILTER
      },
      CHECKS   :
				[{    // Crawl linked wiki page
					METHOD   : 'CRAWL',
					SELECTORS: ['a'],
					FILTER   : {
						ERROR  : [],
						IGNORE : [],
						FOLLOW : ['^http://news\.infoseek\.co\.jp/topics/','^http://news\.infoseek\.co\.jp/article/'],
						//FOLLOW : ['^http://news\.infoseek\.co\.jp/topics/'],
						INNER_DOMAIN   : false
	    //INNER_DOMAIN   : true
					}
				}]
    }
  };
}
