//var sys = require('sys');
var sys = require('util');
var fs  = require('fs');
var log     = require( __dirname + '/../lib/log.js');
var stdtest = require( __dirname + '/../lib/stdtest.js');
// all page
exports.get = function() {
  return {
    TEST_NAME: 'mongodbjp',
    URL      : 'http://www.mongodb.jp/',
    PROXY    : null, // <host>:<port>
    SSLPROXY : null, // Not supported
    TIMEOUT  : 30000, // msec
    WAIT     : 10,  // msec
		FETCH_BODY: true,
		USECOOKIE: true,
		MONGO : {
			host: 'localhost',
			port: 27017,
			dbname: 'test',
		},
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
						FOLLOW : [],
						INNER_DOMAIN   : true
					}
				}]
    }
  };
}
