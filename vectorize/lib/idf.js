var _src   = utils.getCollection(_SRC);
var meta   = utils.getmeta(_src);
if ( ! meta || 	meta.type !== 'DF' ) {
	print('== Invalid collection : ' + _src + ' ==');
	printjson(meta);
	quit();
}

if ( ! _OUT ){
	var psrc = utils.parseCollection(meta.token);
	_OUT = psrc.db + '.vector.idf.'   +psrc.col;
}

print('== IDF : ' + _OUT + ' ==');
var _df = _src;
var _idf = utils.getWritableCollection(_OUT);
var _job = utils.getWritableCollection(_OUT+'.job');
var _dic = utils.getCollection(meta.dic);
if ( _CJOB ) {
	var _c_df = _df.find(utils.IGNORE_META,{_id:1});
	utils.reset_job(_c_df,_job);
		_idf.drop();
	quit();
}
meta.type  = 'IDF';
meta.idf   = _OUT;
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
		if ( _VERBOSE ) {
			print('EXCEPT : ' + df._id + ' : ' + df.value + ' / ' + meta.docs + ' = ' + propotion);
		}
		continue;
	}		
	if ( _VERB ) {
		if ( ! _dic.find({_id:ObjectId(df._id),t:'名詞'}).count() ) {
			if ( _VERBOSE ) {
				print('NOT VERB : ' + df._id + ' : ' + df.value + ' / ' + meta.docs + ' = ' + propotion);
			}
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
print( ' == '+_OUT+' == ');
