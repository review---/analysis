var _src_split = _SRC.split('\.');
var _db = _pmongo.getDB(_src_split.shift());

var SRC    = _src_split.join('\.');
var _src   = _db.getCollection(SRC);
var _IDF   = 'vector.idf.' + SRC;

var NUM = _src.distinct(_KEY).length;
print('== IDF :'+NUM+ ' ==');

_src.mapReduce (
  			function(){
					var ret = {};
					ret[utils.getField(this,_KEY).valueOf()] = 1;
  				emit(utils.getField(this,_WORD).valueOf(),ret);
  			},
  			function(key,vals){
					var ret = {};
					for ( var i in vals ) {
						utils.hash_merge_sum(ret,vals[i]);
					}
					return ret;
  			},
     		{ 
					out: _IDF,
					scope: { 
						NUM:NUM,
						_KEY:_KEY,
						_WORD:_WORD,
						_THRESHOLD:_THRESHOLD,
						utils:utils
					},
					finalize : function(key,val){
						var val = Math.log(NUM / utils.hash_count(val) );
						if ( val <= _THRESHOLD ) {
							return 0;
						}
						return val;
					}
				}
);
