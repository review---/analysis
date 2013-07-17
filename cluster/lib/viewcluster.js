
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
var _src         = utils.getCollection(_SRC);
var meta         = _src.findOne({_id:'.meta'});
var _data        = utils.getCollection(meta.data);
var _doc         = utils.getCollection(meta.doc);
var _dictionary  = utils.getCollection(meta.dic);

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
			var doc = _doc.findOne({_id:oid},{_id:0})
			print(JSON.stringify(doc).slice(0,50));		
		}
	}
}