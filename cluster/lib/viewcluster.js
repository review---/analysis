var _dic_split    = _DIC.split('\.');
var _dictionary_db_name = _dic_split.shift();
var _dictionary_col_name = _dic_split.join('\.');
var _dictionary  = db.getMongo().getDB(_dictionary_db_name).getCollection(_dictionary_col_name);

var _src_split= _SRC.split('\.');
var _src_db_name = _src_split.shift();
var _src_col_name = _src_split.join('\.');
var _src  = db.getMongo().getDB(_src_db_name).getCollection(_src_col_name);

// @@@ Array.sort seems like work well...
function sort(arr,comparator){
	if ( arr.length < 1 ) {
		return arr;
	}
	var c=arr.shift();
	var b=[];
	var a=[];
	for ( var i in arr ) {
		if ( comparator(arr[i],c) ) {
			b.push(arr[i]);
		}else{
			a.push(arr[i]);
		}
	}
	return sort(b,comparator).concat(c).concat(sort(a,comparator));
}
var meta = _src.findOne({_id:'.meta'});
var _data  = db.getMongo().getDB(_src_db_name).getCollection(meta.data);
var ORG = meta.org.split('\.');
var _org  = db.getMongo().getDB(ORG.shift()).getCollection(ORG.join('\.'));

var _c_src = _src.find({_id:{'$ne':'.meta'}});
while ( _c_src.hasNext() ) {
	var cluster = _c_src.next();
	print('====== ' + cluster._id + ' ( ' + cluster.value.s + ' ) ======');
	var ls = [];
	for ( var i in cluster.value.loc ) {
		var l = cluster.value.loc[i];
		ls.push({id:i,s:l});
	}
	var ls = sort(ls,function(a,b){ return (a.s > b.s); });
	for ( i = 0 ; i < 10 ; i++ ) {
		var o = ObjectId(ls[i].id);
		var v = _dictionary.findOne({_id:o});
		print( ls[i].s + "\t : " + v.w );
	}
	if ( _VERBOSE ) {
		var _c_data = _data.find({'value.c':cluster._id});
		while(_c_data.hasNext()){
			var data = _c_data.next();
			var oid = ObjectId(data._id);
			var doc = _org.findOne({_id:oid},{_id:0})
			print(JSON.stringify(doc).slice(0,50));		
		}
	}
}