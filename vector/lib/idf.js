var _src_split = _SRC.split('\.');
var _db = _pmongo.getDB(_src_split.shift());

var SRC    = _src_split.join('\.');
var _src   = _db.getCollection(SRC);
var _IDF   = 'vector.idf.' + SRC;
var _idf   = _db.getCollection(_IDF);
var NUM = _src.distinct(_KEY,{_id:{'$ne':'.meta'}}).length;
print('== IDF :'+NUM+ ' ==');

var meta = _src.findOne({_id:'.meta'},{_id:0});
meta.parse = _SRC;
_idf.drop();
_idf.findAndModify({
	query: {_id:'.meta'},
	update:{ $setOnInsert:meta},
	upsert:true
});

_src.mapReduce (
  			function(){
					if ( this._id !== '.meta' ) {
						var ret = {};
						ret[utils.getField(this,_KEY).valueOf()] = 1;
  					emit(utils.getField(this,_WORD).valueOf(),ret);
					}
  			},
  			function(key,vals){
					var ret = {};
					for ( var i in vals ) {
						utils.hash_merge_sum(ret,vals[i]);
					}
					return ret;
  			},
     		{ 
					out: {merge:_IDF},
					scope: { 
						NUM:NUM,
						_KEY:_KEY,
						_WORD:_WORD,
						_THRESHOLD:_THRESHOLD,
						_LIMIT:_LIMIT,
						utils:utils
					},
					finalize : function(key,val){
						var prop = utils.hash_count(val) / NUM;
						if ( _LIMIT <= prop ) {
							return 0;
						}else if ( _THRESHOLD >= prop ) {
							return 0;
						}
						return Math.log(1/prop);
					}
				}
);
