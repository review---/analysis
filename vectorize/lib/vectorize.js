var _src_split = _SRC.split('\.');
var _DB     = _src_split.shift();
var SRC    = _src_split.join('\.');

var _TF    = _DB + '.vector.tf.'   + SRC;
var _DF    = _DB + '.vector.df.'   + SRC;
var _IDF   = _DB + '.vector.idf.'  + SRC;
var _TFIDF = _DB + '.vector.tfidf.'+ SRC;

function tf(){
	print('== TF : ' + _TF + ' ==');
	var _src   = utils.getCollection(_SRC);
	var meta   = utils.getmeta(_src);
	var _tf    = utils.getWritableCollection(_TF);
	var _job   = utils.getWritableCollection(_TF+'.job');
	if ( _CJOB ) {
		var _c_src = _src.find({i:1},{_id:0,d:1});
		utils.reset_job(_c_src,_job,_KEY);
			_tf.drop();
			_tf.ensureIndex({'value.w':1})
		return;
	}
	meta.parse = _SRC;
	meta.normalize = true;
	meta.docs = _job.stats().count;
	utils.setmeta(_tf,meta);

	// Loop
	while (true){
		var job = utils.get_job(_job);
		if ( ! job ) {
			break;
		}
		var docid = job._id;
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
	var _tf = utils.getCollection(_TF);
	var meta=	utils.getmeta(_tf);
	var _df = utils.getWritableCollection(_DF);
	var _job = utils.getWritableCollection(_DF+'.job');
	if ( _CJOB ) {
		var _c_tf = _tf.find(utils.IGNORE_META,{_id:1});
		utils.reset_job(_c_tf,_job);
			_df.drop();
		return;
	}
	utils.setmeta(_df,meta);

	// Loop
	while ( true ) {
		var job = utils.get_job(_job);
		if ( ! job ) {
			break;
		}
		var tf = _tf.findOne({_id:job._id});
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
		print(tf._id + ' : ' + ndim);
	}	
}
function idf(){
	print('== IDF : ' + _IDF + ' ==');
	var _df = utils.getCollection(_DF);
	var meta=	utils.getmeta(_df);
	var _idf = utils.getWritableCollection(_IDF);
	var _job = utils.getWritableCollection(_IDF+'.job');
	var _dic = utils.getCollection(meta.dic);
	if ( _CJOB ) {
		var _c_df = _df.find(utils.IGNORE_META,{_id:1});
		utils.reset_job(_c_df,_job);
			_idf.drop();
		return;
	}
	meta.idf_limit     = _LIMIT;
	meta.idf_threshold = _THRESHOLD;
	meta.idf_verb = _VERB;
	utils.setmeta(_idf,meta);

	while ( true ) {
		var job = utils.get_job(_job);
		if ( ! job ) {
			break;
		}
		var df = _df.findOne({_id:job._id});
		var propotion = df.value / meta.docs;
		if ( df.value <= 1 || propotion >= _LIMIT || _THRESHOLD >= propotion ) {
			print('EXCEPT : ' + df._id + ' : ' + df.value + ' / ' + meta.docs + ' = ' + propotion);
			continue;
		}		
		if ( _VERB ) {
			if ( ! _dic.find({_id:ObjectId(df._id),t:'名詞'}).count() ) {
				print('NOT VERB : ' + df._id + ' : ' + df.value + ' / ' + meta.docs + ' = ' + propotion);
				continue;
			}
		}
		_idf.save({
			_id: df._id,
			value:df.value,
			i:Math.log(meta.docs/df.value)
		});
		print(df._id + ' : ' + df.value + ' => ' + Math.log(meta.docs/df.value));
	}
}

function tfidf(){
	print('== TFIDF : ' + _TFIDF + ' ==');
	var _tf  = utils.getCollection(_TF);
	var _idf = utils.getCollection(_IDF);
	var _tfidf = utils.getWritableCollection(_TFIDF);
	var _job = utils.getWritableCollection(_TFIDF+'.job');
	if ( _CJOB ) {
		var _c_tf = _tf.find(utils.IGNORE_META,{_id:1});
		utils.reset_job(_c_tf,_job);
			_tfidf.drop();
		return;
	}
	var meta=	utils.getmeta(_idf);
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
}
