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
	var vs = sort(vs,function(a,b){ return (a.s > b.s); });
	for ( i = 0 ; i < 10 ; i++ ) {
		var o = ObjectId(vs[i].id);
		var v = _dictionary.findOne({_id:o});
		print( vs[i].s + "\t : " + v.w );
	}
}