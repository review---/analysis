var _dictionary_name = _DIC.split('\.');
var _db = db.getMongo().getDB(_dictionary_name.shift());

var _DICTIONARY     = _dictionary_name.join('\.');
var _DICTIONARY_TMP = _DICTIONARY+'.tmp';
var _DICTIONARY_ORG = _DICTIONARY+'.ipadic';



var TYPELIST = {
		"記号"    :  10,
		"その他"  :  20,
		"感動詞"  :  40,
		"助詞"    :  50,
		"副詞"    :  70,
		"連体詞"  :  90,
		"接続詞"  : 100,
		"接頭詞"  : 200,
		"名詞"    : 300,
		"ORG"     : 400,
		"フィラー": 500,
		"形容詞"  :1000,
		"動詞"    :1200,
		"助動詞"  :1500,
		"不明"    :9999
}
_db.getCollection(_DICTIONARY_ORG).mapReduce (
  			function(){
  				emit(this.w,{
						w:this.w,
						l:this.w.length,
						s:TYPELIST[this.t[0]],
						p:this.p,
						c:this.c,
						t:this.t,
						f:{},
					});
  			},
  			function(key,vals){
					var ret = {
						w:vals[0].w,
						l:vals[0].l,
						p:[],
						s:vals[0].s,
						c:vals[0].c,
						t:[],
						f:{}
					};
					var ps = [];
					var ts = [];
					for ( var i in vals ) {
						var v = vals[i];
						if ( ret.c > v.c ) {
							ret.c = v.c;
						}
						ts = ts.concat(v.t);
						ps = ps.concat(v.p);
					}
					ret.t = utils.unique(ts);
					ret.p = utils.unique(ps);
					for ( var i in ret.t ) {
						var s = TYPELIST[ret.t[i]];
						if ( ret.s < s ){
							ret.s = s;
						}
					}
  				return ret;
  			},
     		{ 
					out: _DICTIONARY_TMP,
					scope: { 
						TYPELIST:TYPELIST,
						utils: utils,
						morpho: morpho
					},
					finalize : function(key,val){
						return morpho.forms(val);
					}
				}
);

var _dictionary_tmp = _db.getCollection(_DICTIONARY_TMP);
var _dictionary = _db.getCollection(_DICTIONARY);
_dictionary.drop();

var elems= _dictionary_tmp.find();
while (elems.hasNext()){
	var elem = elems.next();
	_dictionary.save(elem.value);
}
_dictionary_tmp.drop();

_dictionary.ensureIndex({w:1});
_dictionary.ensureIndex({t:1});
