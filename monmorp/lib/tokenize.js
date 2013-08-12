var dictionary = new Dictionary(_DIC);

var psrc = utils.parseCollection(_SRC);
if ( ! _OUT ){
	_OUT = psrc.db + '.token.' + psrc.col;
}

var _src;
var _dst;
var _job;
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
	_src  = utils.getCollection(_SRC);
	_dst     = utils.getWritableCollection(_OUT);
	_job = utils.getWritableCollection(_OUT + '.job');
}

if ( _CJOB ) {
	var _c_src = _src.find(utils.IGNORE_META,{_id:1});
	utils.reset_job(_c_src,_job);
	_dst.drop();
	_dst.ensureIndex({d:1,i:1});
	_dst.ensureIndex({i:1});
	_dst.ensureIndex({w:1});
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
	type: 'TOKEN',
	token: _OUT,
	doc: _SRC,
	doc_field: _FIELD,
	dic: _DIC
};
utils.setmeta(_dst,meta);

while ( true ) {
	var job = utils.get_job(_job);
	if ( ! job ) {
		break;
	}
	var doc = _src.findOne({_id:job._id});
		_dst.remove({docid:doc._id});
	var doc = _src.findOne({_id:doc._id});
	tokenizer.parse_doc(doc._id,utils.getField(doc,_FIELD));
	print ( doc._id.toString() + ' : ' + tokenizer.nquery + ' ( ' + tokenizer.nfetch + ' ) ');
}
print( ' == '+_OUT+' == ');