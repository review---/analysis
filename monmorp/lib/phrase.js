var _NGRAM=4;
var _THRESHOLD=1.0;

var _src_split = _SRC.split('\.');
var _DB    = _src_split.shift();
var SRC    = _src_split.join('\.');
var _src   = utils.getCollection(_SRC);
var meta   = utils.getmeta(_src);
var TMP = _DB + '.phrse.' + SRC;
var _tmp = utils.getWritableCollection(TMP);
var _job = utils.getWritableCollection(TMP+'.job');
var dic = new Dictionary(meta.dic);

if ( _CJOB ) {
	var _c_src = _src.find({i:1},{_id:0,d:1});
	utils.reset_job(_c_src,_job,_KEY);
	_tmp.drop();
	_tmp.ensureIndex({n:1,df:1});
	_tmp.ensureIndex({cv:1});
	//_tmp.ensureIndex({tf:1});
	quit();
}

function PhraseAnalysis(n,df_filter,dst,dic){
	this.ngram = Array(n);
	this.df_filter = df_filter;
	this._dst      = dst;
	this.dic       = dic;
}
PhraseAnalysis.prototype.is_continuous = function(){
	var prev = true;
	var cur  = true;
	var w  = '';
	var sw = [];
	var n  = 0;
	for ( var i = 0; i <  this.ngram.length ; i++ ) {
		prev = cur;
		cur = this.ngram[i];
		if ( ! prev || ! cur || cur.i - prev.i > 1 ){
			return null;
		}
		w += cur.w;
		n++;
		sw.push(cur.w);
	}
	return {w:w,n:n,sw:sw };
}
PhraseAnalysis.prototype.do_process = function(t){
	this.ngram.shift();
	this.ngram.push(t);

	var ret = this.is_continuous();
	if ( ! ret ) {
		return;
	}
	if( ret.w in this.df_filter ) {
		this._dst.update(
										 {_id:ret.w},
										 { $inc : {tf:1} },
										 { upsert:true }
										 );
		return;
	}
	// Filter : head or tail is HIRA
	var head = ret.w.charCodeAt(0)
	var tail = ret.w.charCodeAt(ret.w.length-1)
	if (0x3040 <= head && head <= 0x309f || 
			0x3040 <= tail && tail <= 0x309f ){
		return;
	}
	if ( dic.find(
								{
										_id:{ 
												$in: [
															this.ngram[0].c,
															this.ngram[this.ngram.length-1].c
															]},
									t  :{ $in : ['記号','NUMBER','EN','外来','DATE']}})
			.limit(1).count() ) {
		return;
	}

	this._dst.update(
									 {_id:ret.w},
									 { 
											 $setOnInsert: {
												 n : ret.n,
												 sw : ret.sw,
												 t : 0,
												 c : 0,
												 cv : 0
											 },
											 $inc        : {df:1,tf:1} },
									 { upsert:true }
									);
	this.df_filter[ret.w] = 1;
}

function analyize_phrase(){
	while ( true ) {
		var job = utils.get_job(_job);
		if ( ! job ) {
			break;
		}
		var prev = null;
		var cur = null;
		
		
		var df_filter = {};
		var analysises = [];
		for ( var i = _NGRAM; i >= 2; i-- ) {
			analysises.push(new PhraseAnalysis(i,df_filter,_tmp,dic));
		}
		
		var _c_token = _src.find({d:job._id}).sort({i:1})
		while ( _c_token.hasNext()){
			var t  = _c_token.next();
			for ( var i in analysises ) {
				analysises[i].do_process(t);
			}
		}
		utils.end_job(_job,job._id);
		print ( job._id.toString() + ' : ' );
	}
	print('== wait ==');
	utils.waitfor_job(_job);
}

function c_value(field){
	function subs(sw,tmp){
		var tf = tmp[field];
		var n = sw.length;
		if ( n > 2 ) {
			var heads = sw.slice(0,n-1);
				_tmp.update(
										{_id:heads.join('')},
										{ 
												$inc : {
													c : 1,
													t : tf
												}
										}
										);
			var tails = sw.slice(1,n)
				_tmp.update(
										{_id:tails.join('')},
										{ 
												$inc : {
													c : 1,
													t : tf
												}
										}
										);
			subs(heads,tmp);
			subs(tails,tmp);
		}
	}
	var ndocs = _job.stats().count;
	var threshold = Math.log(ndocs) * _THRESHOLD;
	for ( var i = _NGRAM; i >= 2; i-- ) {
		var _c_tmp = _tmp.find({n:i, df:{ $gte: threshold } });
		while ( _c_tmp.hasNext()){
			var tmp = _c_tmp.next();
			// Tuned C-VALUE
			var tf = tmp[field];
			tmp.cv = tf;
			// tmp.cv = Math.log(tmp.n - 1) * tf;
			// tmp.cv = (tmp.n - 1) * tf;
			if ( tmp.c ) {
				tmp.cv = ( tf - tmp.t / tmp.c);
				// tmp.cv = Math.log(tmp.n - 1) * ( tf - tmp.t / tmp.c);
				// tmp.cv = (tmp.n - 1) * ( tf - tmp.t / tmp.c);
			}
				_tmp.save(tmp);
			subs(tmp.sw,tmp);
		}
	}
}

function eval_df(){
	var ndocs = _job.stats().count;
	print('== DO ( '+ndocs+' => '+Math.log(ndocs)+' ) ==');
	

	var start = new Date();
	c_value('df');
	var end = new Date();
	print('== END ==' + (end-start) );
//	var _c_tmp = _tmp.find({df:{ $gte: threshold } }).sort({df:-1})
//	while ( _c_tmp.hasNext()){
//		var tmp = _c_tmp.next();
//		var _c_p = _tmp.find({
//				_id: { $regex: tmp._id},
//			n    : { $gt   : tmp.n}
//		}).sort({df:-1}).limit(1);
//		if ( _c_p.count() > 0 ) {
//			var p = _c_p.next();
//			if ( tmp.df - p.df <= threshold ){
//				print(tmp._id + ' ( ' + tmp.df + ' )  : ' + p._id+ ' ( ' + p.df + ' ) = ' + (tmp.df - p.df));
//			}
//			continue;
//		}
//		var candidate = morpho.forms(dic.nheads(),{w:tmp._id,l:tmp._id.length,c:0,s:300,t:["名詞","ORG","PHRASE"]});
//		db.tmp2.save(candidate);
//	}

}

analyize_phrase();
var semaphore = _job.findAndModify({
	query: utils.META,
	update:{ $setOnInsert:{st:1}},
	upsert:true
});	
if ( semaphore ) {
print('== QUIT ==');
	quit();
}
_job.update(utils.META,{$set:{st:2}});
eval_df();
