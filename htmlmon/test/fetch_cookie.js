function assertEq ( e , a ) {
  if ( e == a ) {
    return true;
  }
  throw 'Exp: ' + e + '  , Act: ' + a ;
}
function UnitTest(test){
  for ( var i in test ) {
    if ( typeof(test[i]) === 'function' && i !== 'setUp' && i !== 'tearDown' ) {
      try {
        if ( test.setUp ) {
          test.setUp();
        }
        test[i]();
        console.log( i + ' : OK ');
        if ( test.tearDown ) {
          test.tearDown();
        }
      }catch(e){
        console.log( i + ' : ERROR : ' + e );
      }
    }
  }
}

var sync = require('synchronize');
var fetchCookie = require('../lib/fetch_cookie.js').fetch_cookie({host: 'localhost', port: 27017, dbname: 'test'}, 'fetchcookie.test');

sync.fiber(function(){
	fetchCookie.init(true);

	UnitTest({
		setUp: function(){
		},
		tearDown: function(){
		},
		parse_cookie: function(){
			var parsed = fetchCookie.parse_cookie('k1=v1; domain=.foobar.com; path=/pathto/; expires=Sun, 07 Jun 2015 01:01:03 +0900; HttpOnly; Secure;');
			assertEq(
				JSON.stringify({
					k: 'k1',
					v: 'v1',
					domain: '.foobar.com',
					path: '/pathto/',
					expires: 'Sun, 07 Jun 2015 01:01:03 +0900',
					httponly: '',
					secure: ''
				}),
				JSON.stringify(parsed)
			);
		},
		domains: function(){
			var domains = fetchCookie.domains('www.foobar.com');
			assertEq(
				JSON.stringify([
					'com.',
					'.com.',
					'foobar.com.',
					'.foobar.com.',
					'www.foobar.com.',
					'.www.foobar.com.',
				]),
				JSON.stringify(domains)
			);
		},
		paths1: function(){
			var paths = fetchCookie.paths('/');
			assertEq(
				JSON.stringify(['/']),
				JSON.stringify(paths)
			);
		},
		paths2: function(){
			var paths = fetchCookie.paths('/foo/bar');
			assertEq(
				JSON.stringify(['/','/foo/','/foo/bar/']),
				JSON.stringify(paths)
			);
		},
		paths3: function(){
			var paths = fetchCookie.paths('/foo/bar/');
			assertEq(
				JSON.stringify(['/','/foo/','/foo/bar/']),
				JSON.stringify(paths)
			);
		},
		store_full: function(){
			fetchCookie.store('www.foobar.com', '/pathto/', ['k1=v1; domain=.foobar.com; path=/; expires=Sun, 07 Jun 2015 01:01:03 +0900;']);
		},
		store_without_path: function(){
			fetchCookie.store('www.foobar.com', '/pathto/', ['k2=v2; domain=.foobar.com; expires=Sun, 07 Jun 2015 01:01:03 +0900;']);
		},
		store_without_domain: function(){
			fetchCookie.store('www.foobar.com', '/pathto/', ['k3=v3; path=/; expires=Sun, 07 Jun 2015 01:01:03 +0900;']);
		},
		store_secure: function(){
			fetchCookie.store('www.foobar.com', '/pathto/', ['k4=v4; HttpOnly; Secure;']);
		},
		get: function(){
			var cookies = fetchCookie.get('http', 'www.foobar.com', '/pathto/foo/bar');
			assertEq(
				'k1=v1;k2=v2;k3=v3;',
				cookies
			);
		},
		get_by_ssl: function(){
			var cookies = fetchCookie.get('https', 'www.foobar.com', '/pathto/foo/bar');
			assertEq(
				'k1=v1;k2=v2;k3=v3;k4=v4;',
				cookies
			);
		},
		get_by_domain: function(){
			var cookies = fetchCookie.get('http', 'foobar.com', '/pathto/foo/bar');
			assertEq(
				'k1=v1;k2=v2;',
				cookies
			);
		},
		get_by_path: function(){
			var cookies = fetchCookie.get('http', 'www.foobar.com', '/foo/');
			assertEq(
				'k1=v1;k3=v3;',
				cookies
			);
		},
	});
});
