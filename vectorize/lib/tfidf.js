var _src   = utils.getCollection(_SRC);
var meta   = utils.getmeta(_src);
if ( ! meta || 	meta.type !== 'IDF' ) {
	print('== Invalid collection : ' + _src + ' ==');
	printjson(meta);
	quit();
}

if ( ! _OUT ){
	var psrc = utils.parseCollection(meta.token);
	_OUT = psrc.db + '.vector.tfidf.'   +psrc.col;
}

print('== TFIDF : ' + _OUT + ' ==');
var _tf  = utils.getCollection(meta.tf);
var _idf = _src;
var _tfidf = utils.getWritableCollection(_OUT);
var _job   = utils.getWritableCollection(_OUT+'.job');
if ( _CJOB ) {
	var _c_tf = _tf.find(utils.IGNORE_META,{_id:1});
	utils.reset_job(_c_tf,_job);
		_tfidf.drop();
	quit();
}
var meta=	utils.getmeta(_idf);
meta.type  = 'TFIDF';
meta.tfidf = _OUT;
utils.setmeta(_tfidf,meta);

	// Get IDF
var idfall = {};
var _c_idf = _idf.find(utils.IGNORE_META);
while ( _c_idf.hasNext() ) {
	var idf = _c_idf.next();
	idfall[idf._id] = idf.i;
}

while ( true ) {
	var job = utils.get_job(_job);
	if ( ! job ) {
		break;
	}
	var tf = _tf.findOne({_id:job._id});
	var docid = tf._id;
	
	var diff = 0;
	var ndim = 0;
	var vec  = {};
	for ( var i in tf.value ) {
		var e = tf.value[i];
		if ( ! (e.w in idfall) || ! idfall[e.w] ) {
			continue;
		}
		
		vec[e.w] = e.c * idfall[e.w];
		diff += vec[e.w]*vec[e.w];
		ndim++;
	}
	var div = Math.sqrt(diff);
	vec = utils.normalize(vec,div);
		_tfidf.save({_id:docid,value:vec});
	print(docid + ' : ' + ndim);
}
print( ' == '+_OUT+' == ');
