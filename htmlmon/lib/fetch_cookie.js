var common = require(__dirname + '/common.js');
var mongodb = require('mongodb');
var sync = require('synchronize');

//---------------------------------
// constructor
//---------------------------------
function FetchCookie(mongo, colname) {
	this.host   = mongo.host;
	this.port   = mongo.port;
	this.dbname = mongo.dbname;
	this.colname= colname;
	this.authdbname = mongo.authdbname;
	this.user = mongo.user;
	this.pass = mongo.pass;
}

FetchCookie.prototype.init = function(drop) {
	if ( this.authdbname ) {
		this.authdb = new mongodb.Db(
			this.authdbname,
			mongodb.Server(this.host,this.port),
			{ safe:true}
		);
		sync.await(this.authdb.open(sync.defer()));
		sync.await(this.authdb.authenticate(this.user, this.pass, sync.defer()));
		this.db = this.authdb.db(this.dbname);
	} else {
		this.db = new mongodb.Db(
			this.dbname,
			mongodb.Server(this.host,this.port),
			{ safe:true}
		);
		sync.await(this.db.open(sync.defer()));
	}

	this.col = this.db.collection(this.colname);
	if ( drop ) {
		try {
			sync.await(this.col.drop(sync.defer()));
		}catch(e){
		}
	}
	sync.await(this.col.ensureIndex({domain: 1},sync.defer()));
}

FetchCookie.prototype.parse_cookie = function(str){
  var cookie = {};
  var cols = str.split(';')
  var re = /^\s*([^=]+)(?:=(.*))?\s*$/;
  for ( var i in cols ){
    if ( re.test(cols[i]) ) {
			if ( cookie['k'] === undefined ) {
				cookie['k'] = RegExp.$1.toLowerCase();
				cookie['v'] = RegExp.$2;
			}else{
				cookie[RegExp.$1.toLowerCase()] = RegExp.$2;
			}
    }
  }
  return cookie;
}

FetchCookie.prototype.store = function(domain, path, cookies) {
  for ( var i in cookies ) {
    var cookie = this.parse_cookie(cookies[i]);
		if ( !cookie.domain ) {
			cookie.domain = domain;
		}
		if ( !/\.$/.test(cookie.domain)) {
			cookie.domain += '.';
		}
		if ( !cookie.path ) {
			cookie.path = path;
		}
		if ( !/\/$/.test(cookie.path)) {
			cookie.path += '/';
		}

		if ( cookie.expires ) {
			cookie.expires = new Date(cookie.expires);
		} else {
			cookie.expires = new Date(2100, 0,1);
		}
		var values = {};
		values['values.'+cookie.k] = {
			v: cookie.v,
			s: ('secure' in cookie),
			e: cookie.expires,
		};
		if ( cookie.expires < new Date() ){
			// remove cookie
			values['values.'+cookie.k] = undefined;
		}
		sync.await(this.col.update( {
			domain : cookie.domain,
			path : cookie.path
		}, {
			$set: values
		}, {
			upsert : true
		} , sync.defer()));
	}
}

FetchCookie.prototype.domains = function(domain) {
	var domains = [];
	var current = '.';
	var ds = domain.split('.').reverse();
	for(var i in ds ) {
		var d = ds[i];
		current = d + current;
		domains.push(current);
		current = '.' + current;
		domains.push(current);
	}
	return domains;
}

FetchCookie.prototype.paths = function(path) {
	var paths = [];
	var current = '/';
	paths.push(current);
	var ps = path.split('/');
	for(var i in ps ) {
		var p = ps[i];
		if ( p ) {
			current +=  p+'/';
			paths.push(current);
		}
	}
	return paths;
}

FetchCookie.prototype.get = function(protocol, domain, path) {
	var domains = this.domains(domain);
	var paths = this.paths(path);
	var cookies = sync.await(this.col.find({
		domain : {
			$in: domains
		},
		path : {
			$in: paths
		},
	}).toArray(sync.defer()));

	var merged = {};
	for ( var i in cookies ){
		var cookie = cookies[i];
		for ( var k in cookie.values ){
			var value = cookie.values[k];
			if ( protocol !== 'https' && value.s){
				continue;
			}
			merged[k] = value.v;
		}
	}
	var ret = '';
	for ( var i in merged ){
		ret += i + '=' + merged[i] + ';'
	}
	return ret;
}
// exports.get = function (protocol,domain,path) {
//   if ( ! domain ){
//     return null;
//   }
//   function get_cookie_p ( place,protocol,path  ) {
//     if ( ! place || ! place['/'] ) {
//       return '';
//     }
//     var str = '';
//     for( var p in place['/'] ) {
//       if ( path.indexOf(p) === 0 ){
// 				for ( var k in place['/'][p] ) {
// 					if ( place['/'][p][k]['httponly'] && protocol !== 'http' ) {
// 						continue;
// 					}
// 					if ( place['/'][p][k]['secure'] && protocol !== 'https' ) {
// 						continue;
// 					}
// 					str += k + '=' + place['/'][p][k]['v']+';';
// 				}
//       }
//     }
//     return str;
//   }
//   function get_cookie_d ( str , place , protocol , domains , path  ) {
//     if ( ! place ) {
//       return str;
//     }
//     if ( ! domains.length ) {
//       return str + get_cookie_p(place,protocol,path);
//     }
//     str += get_cookie_p(place[''],protocol,path);
//     var d = domains.pop();
//     return get_cookie_d(str,place[d],protocol,domains,path);
//   }
//   var ret = get_cookie_d('',fetch_cookies,protocol,domain.split('.'),path);
//   return ret;
// }


exports.fetch_cookie = function(mongo,colname) {
	return new FetchCookie(mongo,colname);
}
