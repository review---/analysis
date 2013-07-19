var _src         = utils.getCollection(_SRC);
var meta         = _src.findOne({_id:'.meta'});
var _doc         = utils.getCollection(meta.doc);
var _dictionary  = utils.getCollection(meta.dic);

var _c_src = _src.find({_id:{'$ne':'.meta'}});
while ( _c_src.hasNext() ) {
	var vector = _c_src.next();
	print('====== ' + vector._id + ' ) ======');
	var vs = [];
	for ( var i in vector.value ) {
		var l = vector.value[i];
		vs.push({id:i,s:l});
	}
	var vs = utils.sort(vs,function(a,b){ return (a.s > b.s); });
	for ( i = 0 ; i < 10 ; i++ ) {
		var o = ObjectId(vs[i].id);
		var v = _dictionary.findOne({_id:o});
		print( vs[i].s + "\t : " + v.w );
	}
}