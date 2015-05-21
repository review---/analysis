var sys    = require('util');
var common = require(__dirname + '/common.js');
var mongodb = require('mongodb');
var sync = require('synchronize');

function FetchList(mongo,colname) {
	this.host   = mongo.host;
	this.port   = mongo.port;
	this.dbname = mongo.dbname;
	this.colname= colname;
	this.authdbname = mongo.authdbname;
	this.user = mongo.user;
	this.pass = mongo.pass;
}
//---------------------------------
// constructor
//---------------------------------
FetchList.prototype.init = function(drop) {

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
	sync.await(this.col.ensureIndex({status:1},sync.defer()));
	sync.await(this.col.ensureIndex({code:1},sync.defer()));
	sync.await(this.col.ensureIndex({referer:1},sync.defer()));
	sync.await(this.col.update(
														 {status:{'$ne': 'End'} },
														 { '$set' : {status:'Queuing',code:'queuing...'} } ,
														 { multi : true } , sync.defer()));
}

//---------------------------------
// operator
//---------------------------------
FetchList.prototype.resetError = function () {
	sync.await(this.col.update(
														 {code:{'$in':[ 'ERROR','TIMEOUT']} },
														 { '$set' : {status:'Queuing',code:'queuing...'} } ,
														 { multi : true } , sync.defer()));
}
FetchList.prototype.queuing_count = function () {
	return sync.await(this.col.count( {status:'Queuing'}, sync.defer()));
}
FetchList.prototype.fetching_count = function () {
	return sync.await(this.col.count( {status:'Fetching'}, sync.defer()));
}
FetchList.prototype.end_count = function () {
	return sync.await(this.col.count( {status:'End'}, sync.defer()));
}
FetchList.prototype.target_count = function () {
	var stats = sync.await(this.col.stats(sync.defer()));
	var end = this.end_count();
	return ( stats.count - end);
}

FetchList.prototype.change = function (url,pharse,code,test,referer) {
	var update = { status: pharse,date:new Date().getTime() };
	if ( code ) {
		update['code'] = code;
	}
	if ( test ) {
		update['test'] = test;
	}
	var data = {
		$set: update
	}
	if ( referer ) {
		data['$addToSet'] = { referer: referer }
	}
	sync.await(this.col.update( { _id : url}, data, { upsert : true } , sync.defer()));
}

FetchList.prototype.requeuing = function (url) {
  this.change(url,'Queuing');
}

FetchList.prototype.status_code = function (url,status) {
  this.change(url,'Status',status);
}

FetchList.prototype.skip_fetching = function (url,reason) {
  this.change(url,'End',reason);
}

FetchList.prototype.fetched = function (url,content_type,body_len) {
  this.change(url,'Fetched',{ content_type: content_type,size:body_len});
}

FetchList.prototype.error = function (url) {
  this.change(url,'End','ERROR');
}
FetchList.prototype.end = function (url) {
  this.change(url,'End');
}

FetchList.prototype.timeout = function (url) {
	var data =  sync.await(this.col.findAndModify(
																								{ _id : url, status: { '$ne': 'End'} },
																								{},
																								{ '$set' : { status: 'End', code:'TIMEOUT',date:new Date().getTime() } } ,
																								{ new : true } , sync.defer()));
	if ( data ) {
		return true;
	}
	return false;
}

FetchList.prototype.queuing = function (url,test,referer) {
	var data = sync.await(this.col.findOne( { _id : url}, sync.defer()));
	if ( data ) {
		return data;
  }
	this.change(url,'Queuing',Array(50).join(' '),test,referer);
	return null;
}
FetchList.prototype.fetching = function () {
	return sync.await(this.col.findAndModify(
		{ status: 'Queuing' },
		{},
		{ '$set' : { status: 'Fetching',date:new Date().getTime() } } ,
		{ new : true } , sync.defer())).value;
}

//---------------------------------
// operator
//---------------------------------
FetchList.prototype.pushAll = function ( urls, headers , test ,referer ) {
	for ( var i in urls ) {
		fetch_queue_q.push({URL:urls[i],TEST:test,REFERER:referer});
	}
  save();
}
FetchList.prototype.push = function ( url , headers , test , referer ) {
  fetch_queue_q.push({URL:url,TEST:test,REFERER:referer});
  save();
}

FetchList.prototype.pop  = function () {
  var ret = fetch_queue_q.pop();
  save();
  return ret;
}

FetchList.prototype.length = function () {
  return fetch_queue_q.length;
}

//---------------------------------
// utilities
//---------------------------------

exports.fetch_list = function(mongo,colname) {
	return new FetchList(mongo,colname);
}
