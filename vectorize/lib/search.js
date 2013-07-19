var _src         = utils.getCollection(_SRC);
var meta         = _src.findOne({_id:'.meta'});
var dictionary   = new Dictionary(meta.dic);

var ts = []
_dst = { 
	save : function(token) {
		if ( token.c){
			var elem = dictionary.findOne({_id:token.c});
			ts.push(elem._id.valueOf());
			if ( _VERBOSE ) {
				print(elem.w);
			}
		}
	},
	findAndModify: function(a){
	},
	remove: function(a){
	},
};
var tokenizer = new JPTokenizer(dictionary,_dst);
var docid = ISODate();
tokenizer.parse_doc(docid,_WORD);
var ins = [];
var _c_src = _src.find({'value.w': { $all : ts }});
while(_c_src.hasNext()){
	var doc = _c_src.next();
	var oid = ObjectId(doc._id);
	ins.push(oid);
}
printjson(ins);

if ( _VERBOSE ) {
	var _doc         = utils.getCollection(meta.doc);
	var query = {_id:{'$in':ins}};
	var _c_doc = _doc.find(query);
	while ( _c_doc.hasNext() ) {
		var doc = _c_doc.next();
		printjson(doc);
	}
}
quit();

var docs = {};
var _c_src = _src.find(_QUERY);
while ( _c_src.hasNext() ) {
	var token = _c_src.next();
	var docid = token.d.valueOf();
	if ( ! docs[docid] ) {
		docs[docid] = 0;
	}
	docs[docid]++;
//	var ls = [];
//	for ( var i in cluster.value.loc ) {
//		var l = cluster.value.loc[i];
//		ls.push({id:i,s:l});
//	}
//	var ls = utils.sort(ls,function(a,b){ return (a.s > b.s); });
//	for ( i = 0 ; i < 10 ; i++ ) {
//		var o = ObjectId(ls[i].id);
//		var v = _dictionary.findOne({_id:o});
//		print( ls[i].s + "\t : " + v.w );
//	}
//	if ( _VERBOSE ) {
//		var _c_data = _data.find({'value.c':cluster._id});
//		while(_c_data.hasNext()){
//			var data = _c_data.next();
//			var oid = ObjectId(data._id);
//			var doc = _doc.findOne({_id:oid},{_id:0})
//			print(JSON.stringify(doc).slice(0,50));		
//		}
//	}
}
var sorted_docs = [];
for ( var i in docs ){
	sorted_docs.push({d:i,n:docs[i]});
}
sorted_docs = utils.sort(sorted_docs,function(a,b){return a.n > b.n});
printjson(sorted_docs);

if ( _VERBOSE ) {
	var ins = [];
	for ( var i in sorted_docs ) {
		var d = sorted_docs[i];	
		var oid = ObjectId(d.d);
		ins.push(oid);
	}
	var _doc         = utils.getCollection(meta.doc);
	var query = {_id:{'$in':ins}};
	var _c_doc = _doc.find(query);
	while ( _c_doc.hasNext() ) {
		var doc = _c_doc.next();
		printjson(doc);
	}
}

