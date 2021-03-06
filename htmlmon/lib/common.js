//var sys = require('util');
var fs = require('fs');
var path = require('path');


exports.common = function(){
  return this;
}
exports.mkdirp = function(dir){
  var parent = path.dirname(dir);
  if ( ! fs.existsSync(parent) ) {
    mkdirp(parent);
  }
  if ( ! fs.existsSync(dir) ) {
    fs.mkdirSync(dir,'755');
  }
}
  
/** Example
var z = {
  a : 'A',
  b : { 
    c : 'C',
    d : [1,2,3]
  },
  e : 'E',
  u : undefined,
  n : null,
  N : null
};
*/

function crawl_object_impl( data , cbobj , path , done , parent ) {

  var in_array = false;
  if ( parent && parent.constructor === Array ){
    in_array = true;
  }

  if ( data === undefined ) {
    cbobj.cb_undefined(path,undefined,false,in_array,undefined)
  } else if (data === null ) {
    cbobj.cb_null(path,null,false,in_array,undefined)
  } else if ( typeof(data) === 'object') {
    var ref    = false;
    var cyclic = false;
    // Check reference objects
    var objid = undefined;
    for ( var no in done ) {
      if ( done[no] === data ) { 
				ref   = true;
				objid = no;
				break;
      }
    }
    if ( ! ref ) {
      done.push(data);
      objid = done.length;
    }
    // Check cyclic objects
    for ( var no in path ) {
      if ( objid === path[no][1] ){
				cyclic = true;
      }
    }
    if ( data.constructor === RegExp ) {
      cbobj.cb_regexp(path,data,cyclic,in_array,objid);
    }else if ( data.constructor === Date ) {
      cbobj.cb_date(path,data,cyclic,in_array,objid);
    }else if ( data.constructor === Array ) {
      if ( cbobj.cb_array(path,data,cyclic,in_array,objid) ) {
				for ( var i in data ){
					path.push([i,objid]);
					crawl_object_impl ( data[i],cbobj,path , done , data );
					path.pop();
				}
				cbobj.cb_leave_array(path,data,cyclic,in_array,objid);
      }
    }else if ( data.constructor === Object ) {
      if ( cbobj.cb_hash(path,data,cyclic,in_array,objid) ) {
				for ( var i in data ){
					path.push([i,objid]);
					crawl_object_impl( data[i],cbobj,path , done , data );
					path.pop();
				}
				cbobj.cb_leave_hash(path,data,cyclic,in_array,objid);
      }
    }else{
      if ( cbobj.cb_object(path,data,cyclic,in_array,objid) ) {
				for ( var i in data ){
					path.push([i,objid]);
					crawl_object_impl ( data[i],cbobj,path , done , data );
					path.pop();
				}
				cbobj.cb_leave_object(path,data,cyclic,in_array,objid);
      }
    }
  }else{
    if ( typeof(data) === 'string' ) {
      cbobj.cb_string(path,data,false,in_array,undefined)
    }else if( typeof(data) === 'function' ) {
      cbobj.cb_function(path,data,false,in_array,undefined)
    }else{
      cbobj.cb_other(path,data,false,in_array,undefined)
    }
  }
}
exports.crawl_object = function ( data , cbobj ) {
  function cb_nop(path,value,cyclic,in_array,objid){
    return ! cyclic;
  }
  if ( cbobj.cb_undefined   === undefined )  cbobj.cb_undefined   = cb_nop;
  if ( cbobj.cb_null        === undefined )  cbobj.cb_null        = cb_nop;
  if ( cbobj.cb_string      === undefined )  cbobj.cb_string      = cb_nop;
  if ( cbobj.cb_function    === undefined )  cbobj.cb_function    = cb_nop;
  if ( cbobj.cb_other       === undefined )  cbobj.cb_other       = cb_nop;
  if ( cbobj.cb_date        === undefined )  cbobj.cb_date        = cb_nop;
  if ( cbobj.cb_regexp      === undefined )  cbobj.cb_regexp      = cb_nop;
  if ( cbobj.cb_array       === undefined )  cbobj.cb_array       = cb_nop;
  if ( cbobj.cb_hash        === undefined )  cbobj.cb_hash        = cb_nop;
  if ( cbobj.cb_object      === undefined )  cbobj.cb_object      = cb_nop;
  if ( cbobj.cb_leave_array === undefined )  cbobj.cb_leave_array = cb_nop;
  if ( cbobj.cb_leave_hash  === undefined )  cbobj.cb_leave_hash  = cb_nop;
  if ( cbobj.cb_leave_object=== undefined )  cbobj.cb_leave_object= cb_nop;

  crawl_object_impl(data,cbobj,[],[],[],undefined);
}

exports.cond_default = function (val,defalut,cond){
  return (val==null)?defalut:val;
}

exports.parse_mongo = function (node){  
	var ret = {};
	var node_split = node.split(':');
	ret.host = node_split.shift();
	node_split = node_split.join('').split('/');
	ret.port = node_split.shift();
	node_split = node_split.join('').split('.');
	ret.dbname = node_split.shift();
	ret.colname = node_split.join('.');
	return ret;
}

// Extend string
String.prototype.replaceAll = function (org, dest){  
  return this.split(org).join(dest);  
}  

String.prototype.reverse = function (){
  return this.split('').reverse().join('')
}

