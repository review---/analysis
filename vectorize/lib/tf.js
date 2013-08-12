var _src   = utils.getCollection(_SRC);
var meta   = utils.getmeta(_src);
if ( ! meta || 	meta.type !== 'TOKEN' ) {
	print('== Invalid collection : ' + _src + ' ==');
	printjson(meta);
	quit();
}

if ( ! _OUT ){
	var psrc = utils.parseCollection(_SRC);
		_OUT = psrc.db + '.vector.tf.'   +psrc.col;
}
print('== TF : ' + _OUT + ' ==');

var _tf    = utils.getWritableCollection(_OUT);
var _job   = utils.getWritableCollection(_OUT+'.job');
if ( _CJOB ) {
	var _c_src = _src.find({i:1},{_id:0,d:1});
	utils.reset_job(_c_src,_job,_KEY);
		_tf.drop();
		_tf.ensureIndex({'value.w':1})
	quit();
}
meta.type  = 'TF';
meta.tf    = _OUT;
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
print( ' == '+_OUT+' == ');
