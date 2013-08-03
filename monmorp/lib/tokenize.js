var dictionary = new Dictionary(_DIC);

var _src  = utils.getCollection(_SRC);
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
	this._dst.ensureIndex({i:1});
	this._dst.ensureIndex({w:1});
}
if ( _CJOB ) {
	var _c_src = _src.find(utils.IGNORE_META,{_id:1});
	utils.reset_job(_c_src,_dst_job);
		_dst.drop();
	quit();
}

var tokenizer = new JPTokenizer(dictionary,_dst,_VERBOSE);

if ( _SENTENSE ) {
	var docid = ISODate();
	tokenizer.parse_doc(docid,_SENTENSE);
	print ( JSON.stringify(docid) + ' : ' + tokenizer.nquery + ' ( ' + tokenizer.nfetch + ' ) ');
	quit();
}

var meta = { 
	doc: _SRC,
	dic: _DIC
};
utils.setmeta(_dst,meta);

while ( true ) {
	var job = utils.get_job(_dst_job);
	if ( ! job ) {
		break;
	}
	var doc = _src.findOne({_id:job._id});
		_dst.remove({docid:doc._id});
	var doc = _src.findOne({_id:doc._id});
	tokenizer.parse_doc(doc._id,utils.getField(doc,_FIELD));
	print ( doc._id.toString() + ' : ' + tokenizer.nquery + ' ( ' + tokenizer.nfetch + ' ) ');
}
