var dictionary = new Dictionary(_DIC);

var _dst;
var _dst_job;
if ( _OUT === '-' ) {
		_dst = { 
			save : function(ret) {
				if ( ret.c){
					ret.c = dictionary.findOne({_id:ret.c});
				}
				print(JSON.stringify(ret));
			},
			findAndModify: function(a){
			},
			remove: function(a){
			},
		};
}else{
	_dst     = utils.getWritableCollection(_OUT);
	_dst_job = utils.getWritableCollection(_OUT + '.job');

	this._dst.ensureIndex({d:1,i:1});
	this._dst.ensureIndex({w:1});
}
if ( _CJOB ) {
	if ( _dst_job ) {
		_dst_job.drop();
	}
	if ( _dst ) {
		_dst.drop();
	}
	quit();
}

var tokenizer = new JPTokenizer(dictionary,_dst,_VERBOSE);

if ( _SENTENSE ) {
	var docid = ISODate();
	tokenizer.parse_doc(docid,_SENTENSE);
	print ( JSON.stringify(docid) + ' : ' + tokenizer.nquery + ' ( ' + tokenizer.nfetch + ' ) ');
	quit();
}

_dst.findAndModify({
	query: {_id:'.meta'},
	update:{ $setOnInsert:{ 
		doc: _SRC,
		dic: _DIC
	}},
	upsert:true
});

var _src  = utils.getCollection(_SRC);
var _c_src = _src.find(_QUERY,{_id:1});
while ( _c_src.hasNext()){
	var doc = _c_src.next();

	var prev = _dst_job.findAndModify({
		query: {_id:doc._id},
		update:{ $setOnInsert:{ tm:ISODate()}},
		upsert:true
	});
	if ( prev ) {
		continue;
	}
		_dst.remove({docid:doc._id});
	var doc = _src.findOne({_id:doc._id});
	tokenizer.parse_doc(doc._id,utils.getField(doc,_FIELD));
	print ( doc._id.toString() + ' : ' + tokenizer.nquery + ' ( ' + tokenizer.nfetch + ' ) ');
}
