var _src   = utils.getCollection(_SRC);
var meta   = utils.getmeta(_src);
if ( ! meta || 	meta.type !== 'TF' ) {
	print('== Invalid collection : ' + _src + ' ==');
	printjson(meta);
	quit();
}

if ( ! _OUT ){
	var psrc = utils.parseCollection(meta.token);
	_OUT = psrc.db + '.vector.df.'   +psrc.col;
}

print('== DF : ' + _OUT + ' ==');
var _tf = _src;
var _df = utils.getWritableCollection(_OUT);
var _job = utils.getWritableCollection(_OUT+'.job');
if ( _CJOB ) {
	var _c_tf = _tf.find(utils.IGNORE_META,{_id:1});
	utils.reset_job(_c_tf,_job);
		_df.drop();
	quit();
}
meta.type  = 'DF';
meta.df    = _OUT;
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
print( ' == '+_OUT+' == ');
