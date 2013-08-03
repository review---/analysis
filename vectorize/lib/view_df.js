var _src         = utils.getCollection(_SRC);
var meta         = utils.getmeta(_src);
var _dictionary  = utils.getCollection(meta.dic);

var _c_src = _src.find({_id:{'$ne':'.meta'}}).sort({value:-1});
while ( _c_src.hasNext() ) {
	var df = _c_src.next();
	var word = _dictionary.findOne({_id:ObjectId(df._id)});
	print( ' ' + df.value + ' : ' + word.w );
}