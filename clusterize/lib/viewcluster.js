var _src         = utils.getCollection(_SRC);
var meta         = _src.findOne({_id:'.meta'});
var _data        = utils.getCollection(meta.data);

var _c_src = _src.find({_id:{'$ne':'.meta'}});
while ( _c_src.hasNext() ) {
	var cluster = _c_src.next();
	print('====== ' + cluster._id + ' ( ' + cluster.value.s + ' ) ======');
	var ls = [];
	for ( var i in cluster.value.loc ) {
		var l = cluster.value.loc[i];
		ls.push({id:i,s:l});
	}
	var _dictionary;
	if ( meta.dic ) {
		_dictionary  = utils.getCollection(meta.dic);
	}
	var ls = utils.sort(ls,function(a,b){ return (a.s > b.s); });
	for ( i = 0 ; i < ls.length ; i++ ) {
		if( i >= 10 ) {
			break;
		}
		if ( meta.dic ) {
			var o = ObjectId(ls[i].id);
			var v = _dictionary.findOne({_id:o});
			print(ls[i].s + "\t : " + v.w );
		}else {
			printjson(ls[i]);
		}
	}
	if ( _VERBOSE ) {
		var _doc         = utils.getCollection(meta.doc);
		var _c_data = _data.find({'value.c':cluster._id});
		while(_c_data.hasNext()){
			var data = _c_data.next();
			var oid = ObjectId(data._id);
			var doc = _doc.findOne({_id:oid},{_id:0})
			print(JSON.stringify(doc).slice(0,50));		
		}
	}
}