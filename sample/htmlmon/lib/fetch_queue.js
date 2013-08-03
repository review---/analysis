//var sys = require('sys');
//var sys    = require('util');
var common = require(__dirname + '/common.js');

var storage;
var fetch_queue_q;
//---------------------------------
// constructor 
//---------------------------------
exports.fetch_queue = function(obj) { 
	storage = obj;
  return this;
}

exports.init = function() {
	storage.init();
  fetch_queue_q = [];
  return this;
}

exports.load = function () {
  fetch_list_c = storage.load();
}

exports.reset = function () {
	storage.reset();
}

//---------------------------------
// operator
//---------------------------------
exports.pushAll = function ( urls, headers , test ,referer ) {
	for ( var i in urls ) {
		fetch_queue_q.push({URL:urls[i],TEST:test,REFERER:referer});
	}
  save();
}
exports.push = function ( url , headers , test , referer ) {
  fetch_queue_q.push({URL:url,TEST:test,REFERER:referer});
  save();
}

exports.pop  = function () {
  var ret = fetch_queue_q.pop();
  save();
  return ret;
}

exports.length = function () {
  return fetch_queue_q.length;
}

//---------------------------------
// utilities
//---------------------------------

function save () {
  if ( fetch_queue_q.length ) {
		storage.save(fetch_queue_q);
  }else{
    storage.reset();
  }
}
