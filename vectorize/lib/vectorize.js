var _src_split = _SRC.split('\.');
var _db = _pmongo.getDB(_src_split.shift());

var SRC    = _src_split.join('\.');
var _src   = _db.getCollection(SRC);
var _src   = utils.getCollection(_SRC);

var _TF    = 'vector.tf.' + SRC;
var _DF    = 'vector.df.' + SRC;
var _TFIDF = 'vector.tfidf.'+SRC;


var meta = _src.findOne({_id:'.meta'},{_id:0});
if ( ! meta ){
	meta = {};
}
meta.parse = _SRC;
meta.normalize = true;


function isVacant(_job,docid){
	var prev = _job.findAndModify({
		query: {_id:docid},
		update:{ $setOnInsert:{ tm:ISODate()}},
		upsert:true
	});
	if ( prev ) {
		return false;
	}
	return true;
}

function tf(){
	print('== TF : ' + _TF + ' ==');
	var _tf = _db.getCollection(_TF);
	var _job = _db.getCollection(_TF+'.job');
	if ( _CJOB ) {
			_job.drop();
			_tf.drop();
			_tf.ensureIndex({'value.w':1})
		return;
	}
		_tf.findAndModify({
			query: {_id:'.meta'},
			update:{ $setOnInsert:meta},
			upsert:true
		});
	// Loop
	var docids = _src.distinct(_KEY,{_id:{'$ne':'.meta'}});
	for ( var i in docids ){
		var docid = docids[i];
		if ( ! isVacant(_job,docid) ) {
			continue;
		}
			_tf.remove({_id:docid});
		var q = {};
		q[_KEY] = docid;
		var f = {_id:0};
		f[_WORD]= 1;
		var id = docid.valueOf();
		var vec = {};
		var _c_src = _src.find(q,f);
		var ndim = 0;
		while(_c_src.hasNext()){
			var val = _c_src.next();
			var w = utils.getField(val,_WORD).valueOf();
			if ( !( w in vec ) ){
				vec[w] = 0;
				ndim++;
			}
			vec[w]++;
		}
		var value = [];
		for ( var e in vec ) {
			value.push({w:e,c:vec[e]});
		}
			_tf.save({_id:id,value:value});
		print(docid + ' : ' + ndim);
	}
}

function df(){
	print('== DF : ' + _DF + ' ==');
	var _df = _db.getCollection(_DF);
	var _job = _db.getCollection(_DF+'.job');
	if ( _CJOB ) {
			_job.drop();
			_df.drop();
		return;
	}
		_df.findAndModify({
			query: {_id:'.meta'},
			update:{ $setOnInsert:meta},
			upsert:true
		});

	// Loop
	var _tf = _db.getCollection(_TF);
	var _c_tf = _tf.find({_id:{'$ne':'.meta'}});
	while ( _c_tf.hasNext() ) {
		var tf = _c_tf.next();
		var docid = tf._id;
		if ( ! isVacant(_job,docid) ) {
			continue;
		}
		var ndim = 0;
		for ( var i in tf.value ) {
			var w = tf.value[i].w;
			_df.update(
									{_id:w},
									{ $inc : {value:1}},
									{ upsert:true }
									);
			ndim++;
		}
		print(docid + ' : ' + ndim);
	}	
}

function tfidf(){
	print('== TFIDF : ' + _TFIDF + ' ==');
	var _tfidf = _db.getCollection(_TFIDF);
	var _job = _db.getCollection(_TFIDF+'.job');
	if ( _CJOB ) {
			_job.drop();
			_tfidf.drop();
		return;
	}
		_tfidf.findAndModify({
			query: {_id:'.meta'},
			update:{ $setOnInsert:meta},
			upsert:true
		});

	var _tf = _db.getCollection(_TF);
	var _c_tf = _tf.find({_id:{'$ne':'.meta'}});
	var numdoc = _c_tf.count();

	// Get IDF
	var _df = _db.getCollection(_DF);
	var idfall = {};
	var _c_df = _df.find();
	while ( _c_df.hasNext() ) {
		var df = _c_df.next();
		idfall[df._id] = { c:df.value,i:Math.log(numdoc/df.value)};
	}

	while ( _c_tf.hasNext() ) {
		var tf = _c_tf.next();
		var docid = tf._id;
		if ( ! isVacant(_job,docid) ) {
			continue;
		}
			_tfidf.remove({_id:docid});

		var diff = 0;
		var ndim = 0;
		var vec  = {};
		for ( var i in tf.value ) {
			var e = tf.value[i];
			if ( ! (e.w in idfall) ) {
				continue;
			}
			var p = idfall[e.w].c/numdoc;
			if ( p >= _LIMIT || _THRESHOLD >= p ) {
				continue;
			}

			vec[e.w] = e.c * idfall[e.w].i;
			diff += vec[e.w]*vec[e.w];
			ndim++;
		}
		var div = Math.sqrt(diff);
		vec = utils.normalize(vec,div);
			_tfidf.save({_id:docid,value:vec});
		print(docid + ' : ' + ndim);
	}
}
