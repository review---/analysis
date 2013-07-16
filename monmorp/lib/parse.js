function JPParser (_pdictionary,_dictionary,_dst,unknown,nheads) {
	this._pdictionary= _pdictionary;
	this._dictionary = _dictionary;
	this._dst        = _dst;
	this.unknown     = unknown;
	this.nheads      = nheads;
}

JPParser.prototype.form = function(sentence,candidate) {
	var ret = null;
	for ( var i in candidate.w ) {
		var word = candidate.w[i];
		var head = sentence.substring(0,word.length);
		if ( word === head ) {
			for ( var i in candidate.f[word] ) {
				var kind = candidate.f[word][i];
				if ( kind === 1 ) {
					candidate.l = word.length;
					ret = [candidate];
				}else if ( kind === 4 ) {
					if ( ret === null || ret[0].l <= word.length ) {
						var follow = this.parse_query(candidate,sentence.substring(word.length),{w:'*',t:{'$in':["名詞"]}});
						if ( follow ) {
							candidate.l = word.length;
							return [candidate].concat(follow);
						}
					}
				}else if ( kind === 2 ) {
					if ( ret === null || ret[0].l <= word.length ) {
						var follow = this.parse_query(candidate,sentence.substring(word.length),{w:'*',t:{'$in':["助動詞","助詞"]}});
						if ( follow ) {
							candidate.l = word.length;
							return [candidate].concat(follow);
						}
					}
				}else if ( kind === 3 ) {
					if ( ret === null || ret[0].l <= word.length ) {
						var follow = this.parse_query(candidate,sentence.substring(word.length),{w:'*',t:{'$in':["動詞"]}});
						if ( follow ) {
							candidate.l = word.length;
							return [candidate].concat(follow);
						}
						candidate.l = word.length;
						return [candidate];
					}
				}
			}
		}
	}
	return ret;
}

function ascii2multi(str){
	var ret = '';
	var code;
	while ( (code = str.charCodeAt(ret.length)) < 128 ) {
		if       ( code <= 0x20 ) {
			ret += ' ';
		}else if ( code <= 0x7f ) {
			ret += String.fromCharCode(0xff00 + code - 0x20);
		}else {
			ret += ' ';
		}
	}
	return ret + str.substring(ret.length);
}
function alphabet(str){
	var ret = '';
	var uriflg = false;
	while ( true ) {
		var code = str.charCodeAt(ret.length);
		if ( code === 0xff1a ) {
			if ( str.charCodeAt(ret.length+1) === 0xff0f && str.charCodeAt(ret.length+2) === 0xff0f ) {
				uriflg = true;
			}else {
				return ret;
			}
		}
		if ( uriflg && code >= 0xff01 && code <= 0xff5e) {
			ret += str[ret.length];
		}else if ( code >= 0xff21 && code <= 0xff3a || code >= 0xff41 && code <= 0xff5a ) { 
			ret += str[ret.length];
		}else{
			return ret;
		}
	}
	return ret;
}
function isIgnore(str){
	var code = str.charCodeAt(0);
	if ( code === 0x3000 || code >= 0x3041 && code <= 0x3094) {
		return false;
	}
	if ( code >= 0x4e00 && code <= 0x9fa5) {
		return false;
	}
	if ( code >= 0xf900 && code <= 0xfa2d) {
		return false;
	}
//	if ( code >= 0xff10 || code >= 0x3040 && code <= 0xff5a) {
//		return false;
//	}
	return true;
}
function katakana(str){
	var ret = '';
	while ( true ) {
		var code = str.charCodeAt(ret.length);
		if       ( code >= 0x30a1 && code <= 0x30fe) {
			ret += str[ret.length];
		}else{
			return ret;
		}
	}
	return ret;
}



JPParser.prototype.search_follows = function(candidate,sentence){
	if ( utils.array_in(candidate.t,"名詞接続") ) {
		var follow = this.parse_query(candidate,sentence,{w:'*',t:{'$in':["名詞"]}});
		if ( follow ) {
			return [candidate].concat(follow);
		}
	}
	if ( utils.array_in(candidate.t,"形容動詞語幹") ) {
		var follow = this.parse_query(candidate,sentence,{w:"だ",t:{'$in':["助動詞"]}});
		if ( follow ) {
			return [candidate].concat(follow);
		}
	}
	if ( utils.array_in(candidate.t,"サ変接続") ) {
		var follow = this.parse_query(candidate,sentence,{w:{'$in':["できる","する"]},t:{'$in':["動詞"]}});
		if ( follow ) {
			return [candidate].concat(follow);
		}
	}
	if ( utils.array_in(candidate.t,"副詞可能") ) {
		var follow = this.parse_query(candidate,sentence,{w:"*",t:adverb})
		if ( follow ) {
			return [candidate].concat(follow);
		}
	}
	if ( utils.array_in(candidate.t,"名詞") ) {
		var follow = this.parse_query(candidate,sentence,{w:"*",t:{'$in':["助詞","名詞"]}});
		if ( follow ) {
			return [candidate].concat(follow);
		}
	}
//	if ( utils.array_in(candidate.t,"NUMBER") ) {
//		var follow = this.parse_query(candidate,sentence,{w:'*',t:{'$in':["助数詞"]}});
//		if ( follow ) {
//			return [candidate].concat(follow);
//		}
//	}
	return [candidate];
}

JPParser.prototype.parse_original = function(sentence,word,type,query){
	var candidate = this._dictionary.findOne({w:word});
	if ( ! candidate ) {
		candidate = morpho.forms(this.nheads,{w:word,l:word.length,c:0,s:300,t:["名詞","ORG",type],h:word[0]});
		candidate = this._pdictionary.findAndModify({
			query:{w:word},
			update:{ $setOnInsert:candidate},
			upsert:true,
			new:true
		});
	}
	return this.search_follows(candidate,sentence.substring(word.length));
}
 

JPParser.prototype.parse_query = function(cur,sentence,query){
	if ( sentence.charCodeAt(0) < 128 ) {
		sentence = ascii2multi(sentence);
	}
	var match;
	if ( (match = sentence.match(morpho.re_date1)) ||  (match = sentence.match(morpho.re_date2)) ) {
		return this.parse_original(sentence,match[0],'DATE');
	}else if ( match = sentence.match(morpho.re_number1) ) {
		return this.parse_original(sentence,match[0],'NUMBER');
	}else if ( match = alphabet(sentence) ) {
		return this.parse_original(sentence,match,'EN');
	}else if ( match = katakana(sentence) ) {
		return this.parse_original(sentence,match,'外来');
	}else if ( isIgnore(sentence) ) {
		return null;
	}			
	if ( query.w === '*' ) {
		delete query.w;
		query.h = sentence.substring(0,this.nheads);
//			query.w = { '$regex':'^'+sentence[0]};
	}
	while(true){
		this.nquery++;
		var _c_dictionary = this._dictionary.find(query).sort({l:-1,s:1});
		while( _c_dictionary.hasNext()){
			var candidate = _c_dictionary.next();
//print(query.h + '   '  + query.w + ' =>  ' + candidate.w);
			this.nfetch++;
			if ( typeof candidate.w === 'string' ){
				var head = sentence.substring(0,candidate.w.length);
				if ( candidate.w !== head ) {
					continue
				}
				return this.search_follows(candidate,sentence.substring(candidate.w.length));
			}else{
				var ret = this.form(sentence,candidate);
				if ( ret ) {
					return ret;
				}
				continue;
			}
		}
		if ( query.h && query.h.length > 1 ) {
			query.h = query.h.substring(0,query.h.length-1);
			query.l = query.h.length;
 			continue
		}
		return null;
	}
}

//var all      = {$in:["名詞","接頭詞","連体詞","形容詞","動詞","副詞","接続詞","助動詞","助詞","その他","記号","フィラー"]};
var all      = {$in:["名詞","接頭詞","連体詞","形容詞","動詞","副詞","接続詞","助動詞","助詞","フィラー","その他"]};
var first    = {$in:["名詞","接頭詞","連体詞","形容詞","動詞","副詞","接続詞","感動詞","フィラー"]};
var noun     = {$in:["名詞","接頭詞","連体詞","形容詞","助詞","感動詞"]};
var verb     = {$in:["名詞","接頭詞","連体詞","形容詞","助動詞","助詞"]};
//var noun     = {$in:["名詞","接頭詞","連体詞","形容詞","助詞"],$nin:["終助詞"]};
//var verb     = {$in:["名詞","接頭詞","連体詞","形容詞","助動詞","助詞"],$nin:["終助詞"]};
var adjective= {$in:["名詞","接頭詞","連体詞","形容詞"]};
var adverb   = {$in:["動詞","副詞","形容詞","形容動詞語幹","接続詞","サ変接続"]};
var ppp      = {$in:["名詞","接頭詞","連体詞","形容詞","動詞","副詞","接続詞","助動詞","助詞","フィラー","その他"]};
var auxverb  = {$in:["名詞","接頭詞","連体詞","形容詞","動詞","副詞","接続詞","助動詞","助詞","フィラー","その他"]};

JPParser.prototype.parse_token = function(cur,sentence){
	var cond = {$in:[]};
	if      ( cur === null ){
		cond = first;
	}else if ( utils.array_in(cur.t,"不明" )){
		cond = all;
	}else	if ( utils.array_in(cur.t,"助動詞" )){
		cond = auxverb;
	}else	if ( utils.array_in(cur.t,"助詞" )){
		cond = ppp;
	}else{ 
		if ( utils.array_in(cur.t,"接続詞" )){
			cond['$in'] = cond['$in'].concat(first['$in']);
		}
		if ( utils.array_in(cur.t,"動詞") ){
			cond['$in'] = cond['$in'].concat(verb['$in']);
		}
		if ( utils.array_in(cur.t,"名詞")  ){
			cond['$in'] = cond['$in'].concat(noun['$in']);
		}
		if ( utils.array_in(cur.t,"副詞" )){
			cond['$in'] = cond['$in'].concat(adverb['$in']);
		}
		if ( utils.array_in(cur.t,"形容詞") || utils.array_in(cur.t,"接頭詞" ) || utils.array_in(cur.t,"連体詞" ))	{
			cond['$in'] = cond['$in'].concat(adjective['$in']);
		}
		if ( cond['$in'].length === 0 ) {
			cond = first;
		}
	}
	return this.parse_query(cur,sentence, {w:'*',t:cond});
}


JPParser.prototype.result = function(pos,word,candidate) {
	// printjson({s:word,d:candidate.w,t:candidate.t,p:candidate.p,c:candidate});
	this._dst.save({
		d:this.docid,
		i: ++this.idx,
		p:pos,
		w:word,
		l:candidate.l,
		c:candidate._id});
}

JPParser.prototype.parse_doc = function(docid,doc){
	this.nquery = 0;
	this.nfetch = 0;
	this.docid = docid;
	this.idx = 0;

	var cur = null;
	var pos = 0;
	var len = doc.length;
	for ( ; pos < len; ) {
		var candidates = this.parse_token(cur,doc.substring(pos,len));
		if ( candidates ) {
			for ( var c in candidates ) {
				var candidate = candidates[c];
				var word = doc.substring(pos,pos+candidate.l);
				this.result(pos,word,candidate);
				pos += candidate.l;
				cur = candidate;
			}
		}else{
			if ( this.unknown ) {
				var word = doc[pos];
				var matches = doc.substring(pos,len).match(/^\s+/);
				if ( matches ) {
					word = matches[0];
					candidate = {w:word,l:word.length,s:9999,t:["不明"]};
				}else{
					var _c_dictionary = this._dictionary.find({w:ascii2multi(word)}).sort({s:-1}).limit(1);
					if ( _c_dictionary.count() ) {
						candidate = _c_dictionary.next();
					}else{
						candidate = {w:word,l:word.length,s:9999,t:["不明"]};
					}
//if ( utils.array_in(candidate.t,"不明") && word !== '-' && word !== '、' && word !== '.' && word !== '+' && word !== ',' && word !== '・' && word !== '"'){
//print(doc[pos] + '    ' + doc.substring(pos-20,pos+20) + '    ' + cur.w + ' => ' + cur.t[0]);
//}
				}
				this.result(pos,word,candidate);
				pos+= candidate.l;
				cur = candidate;
			}else{
				var word = doc[pos];
				var candidate = {w:word,l:1,s:9999,t:["不明"]};
				pos++;
				cur = candidate;
			}
		}
	}
}

var _dic_split    = _DIC.split('\.');
var _dictionary_db_name = _dic_split.shift();
var _dictionary_col_name = _dic_split.join('\.');
var _dictionary  = db.getMongo().getDB(_dictionary_db_name).getCollection(_dictionary_col_name);
var _pdictionary = _pmongo.getDB(_dictionary_db_name).getCollection(_dictionary_col_name);
var _nheads = _dictionary.findOne({w:'.meta'}).nheads;
if( ! _nheads ) {
	print('*** Invalid dictionary : ' + _DIC);
	quit();
}

var _dst;
var _dst_job;
if ( _OUT === '-' ) {
		_dst = { 
			save : function(ret) {
				ret.c = _dictionary.findOne({_id:ret.c});
				print(JSON.stringify(ret));
			}
		};
}else{
	var _out_split    = _OUT.split('\.');
	var _dst_db       = _out_split.shift();
	var _dst_name     = _out_split.join('\.');
	var _dst_job_name = _dst_name + '.job';
		_dst     = _pmongo.getDB(_dst_db).getCollection(_dst_name);
		_dst_job = _pmongo.getDB(_dst_db).getCollection(_dst_job_name);
	this._dst.ensureIndex({d:1,i:1});
}
if ( _CJOB ) {
	if ( _dst_job ) {
		_dst_job.drop();
	}
	quit();
}

var parser = new JPParser(_pdictionary,_dictionary,_dst,_VERBOSE,_nheads);

if ( _SENTENSE ) {
	var docid = ISODate();
	parser.parse_doc(docid,_SENTENSE);
	print ( JSON.stringify(docid) + ' : ' + parser.nquery + ' ( ' + parser.nfetch + ' ) ');
	quit();
}


var _src_split = _SRC.split('\.');
var _src = db.getMongo().getDB(_src_split.shift()).getCollection(_src_split.join('\.'));
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
	parser.parse_doc(doc._id,utils.getField(doc,_FIELD));
	print ( doc._id.toString() + ' : ' + parser.nquery + ' ( ' + parser.nfetch + ' ) ');
}

// -------------- for debug ------------------
//var doc = {body:"ABCZXが23.5万個のABCとBBBB-CCCCになった。私AbbbBC。私ABC。ＡＢＣＺＸが２３．５万個のＡＢＣとＢＢＢＢ‐ＣＣＣＣになった。私ＡｂｂｂＢＣ。私ＡＢＣ。"};
//parser.parse_doc(990,doc.body);
//var doc = {body:"今回私は十分に実行され、一部がなんとかかんとか。"};
//parser.parse_doc(991,doc.body);
//var doc = {body:"待機し続ける。"};
//parser.parse_doc(992,doc.body);
//var doc = {body:"食べ終える。"};
//parser.parse_doc(993,doc.body);
//var doc = {body:"軽く感じるとき。"};
//parser.parse_doc(994,doc.body);
//var doc = {body:"別のフレームワークをベースとしたものへと置き換えられている。"};
//parser.parse_doc(995,doc.body);
//var doc = {body:"よく似ている。"};
//parser.parse_doc(996,doc.body);
//var doc = {body:"group byに似た。"};
//parser.parse_doc(997,doc.body);
//var doc = {body:"2009年初頭に開催された。"};
//parser.parse_doc(998,doc.body);
//var doc = {body:"マイクロトランザクションと呼ばれる限られた範囲のキー。"};
//parser.parse_doc(999,doc.body);
//var doc = {body:"来る人。来た人。来始める。人が来、帰る。"};
//parser.parse_doc(1000,doc.body);
//var doc = {body:"これを買うとしあわせに、、これを買うときは、、"};
//parser.parse_doc(1001,doc.body);
//var doc = {body:"ビルドする、、"};
//parser.parse_doc(1002,doc.body);
//var doc = {body:"バージョン2.2対応の、、"};
//parser.parse_doc(1003,doc.body);

