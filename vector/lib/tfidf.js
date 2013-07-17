var _src_split = _SRC.split('\.');
var _db = _pmongo.getDB(_src_split.shift());

var SRC    = _src_split.join('\.');
var _src   = _db.getCollection(SRC);
var _src   = utils.getCollection(_SRC);

var _IDF   = 'vector.idf.' + SRC;
var _TFIDF = 'vector.tfidf.'+SRC;


var _tfidf = _db.getCollection(_TFIDF);
var _tfidf_job_name = _TFIDF + '.job';
var _tfidf_job = _db.getCollection(_tfidf_job_name);

if ( _CJOB ) {
	if ( _tfidf_job ) {
		_tfidf_job.drop();
	}
	if ( _tfidf ) {
		_tfidf.drop();
	}
	quit();
}

var _idf = _db.getCollection(_IDF);
var idfall = {};
var ndim = 0;
var _c_idf = _idf.find();
while ( _c_idf.hasNext() ) {
	var idf = _c_idf.next();
	idfall[idf._id] = idf.value;
	ndim++;
}


var meta = _src.findOne({_id:'.meta'},{_id:0});
meta.parse = _SRC;
_tfidf.findAndModify({
	query: {_id:'.meta'},
	update:{ $setOnInsert:meta},
	upsert:true
});

var docids = _src.distinct(_KEY,{_id:{'$ne':'.meta'}});
for ( var i in docids ){
	var docid = docids[i];
	var prev = _tfidf_job.findAndModify({
		query: {_id:docid},
		update:{ $setOnInsert:{ tm:ISODate()}},
		upsert:true
	});
	if ( prev ) {
		continue;
	}

		_tfidf.remove({_id:docid});

	var q = {};
	q[_KEY] = docid;
	var f = {_id:0};
	f[_WORD]= 1;
	var id = docid.valueOf();
	var vec = {};
	var _c_src = _src.find(q,f);
	while(_c_src.hasNext()){
		var val = _c_src.next();
		var w = utils.getField(val,_WORD).valueOf();
		if ( !( w in vec ) ){
			vec[w] = 0;
		}
		vec[w]++;
	}
	var diff = 0;
	var ndim = 0;
	for ( var v in vec ) {
		if ( v in idfall ) {
			vec[v] *= idfall[v];
		}else {
			vec[v] = 0;
		}
		if ( vec[v] === 0 ) {
			delete vec[v];
			continue;
		}
		diff += vec[v]*vec[v];
		ndim++;
	}
	var div = Math.sqrt(diff);
	vec = utils.normalize(vec,div);

	_tfidf.save({_id:id,value:vec});
	print(docid + ' : ' + ndim);
}
//print('MAX:' + max);
//if ( max > 0 ) {
//		_tfidf.update({_id:'.meta',max:{ $lt : max } },{ $set : { max : max, ndim: ndim } });
//
//}

//_src.mapReduce (
//  			function(){
//					var ret = {};
//					ret[utils.getField(this,_WORD).valueOf()] = 1;
//					emit(utils.getField(this,_KEY).valueOf(),ret);
//  			},
//  			function(key,vals){
//					var ret = {};
//					for ( var i in vals ) {
//						utils.hash_merge_sum(ret,vals[i]);
//					}
//					return ret;
//  			},
//     		{ 
//					out: _TFIDF,
//					scope: { 
//						utils:utils,
//						idfall:idfall,
//						_KEY:_KEY,
//						_WORD:_WORD,
//						_THRESHOLD:_THRESHOLD
//					},
//					finalize : function(key,val){
//						for ( var i in val ) {
//							if ( i in idfall ) {
//								val[i] *= idfall[i];
//							}else {
//								val[i] = 0;
//							}
//							if ( val[i] <= _THRESHOLD ) {
//								delete val[i];
//							}
//						}
//						return val;
//					}
//				}
//);
