// initial cluster
function kmeans(_db,ns,field,locs) {
	var fin_cluster_collection_name  = 'kmeans.'+ns+'.fin.cluster';
	var fin_data_collection_name     = 'kmeans.'+ns+'.fin.data';
	function iterate(n,cs_history) {
		var prev_cluster_collection_name = 'kmeans.'+ns+'.it'+n+'.cluster';
		var prev_data_collection_name    = 'kmeans.'+ns+'.it'+n+'.data';
		var cluster_collection_name      = 'kmeans.'+ns+'.it'+(n+1)+'.cluster';
		var data_collection_name         = 'kmeans.'+ns+'.it'+(n+1)+'.data';

		if ( n == 0 ) {
			utils.cleanCollections('^kmeans\.'+ns+'\.');
			var cluster_collection = _db.getCollection(cluster_collection_name);
			for ( var l in locs ){
				cluster_collection.save({ value : { name : l , s : 0, loc : locs[l] } })
			}

			var _src = _db.getCollection(ns);

			var data_collection = _db.getCollection(data_collection_name);
			var _c_src = _src.find();
			while(_c_src.hasNext()){
				var data = _c_src.next();
				var loc  = utils.getField(data,field);
				if ( loc ) {
					data_collection.save({
							_id:data._id,
						value:{loc:loc}
					});					
				}
			}

//			_src.mapReduce (
//  			function(){
//					var loc = utils.getField(this,field);
//					if ( loc ) {
//  					emit(this._id,{loc:loc,c:''} );
//					}
//  			},
//  			function(key,vals){
//					// Maybe skip;
//  				return vals[0]; 
//  			},
//     		{ 
//					out: data_collection_name,
//					scope: {
//						utils:utils,
//						field: field
//					}
//				}
//  		);
			return [false,cluster_collection_name,data_collection_name];
		}

		var prev_cluster_collection = _db.getCollection(prev_cluster_collection_name);
		var prev_data_collection = _db.getCollection(prev_data_collection_name);

		var _c_prev_cluster_collection = prev_cluster_collection.find();
		var cs = [];
		while (_c_prev_cluster_collection.hasNext()){
			var cluster = _c_prev_cluster_collection.next();
			cs.push(cluster.value);
		}
		var md5sum = hex_md5(JSON.stringify(cs));

		if ( cs_history[md5sum] ) {
			return [true,prev_cluster_collection_name,prev_data_collection_name];
		}
		cs_history[md5sum] = n;

		var data_collection = _db.getCollection(data_collection_name);

		data_collection.ensureIndex({'value.c':1});
		var _c_prev_data_collection = prev_data_collection.find();
		while(_c_prev_data_collection.hasNext()){
			var data = _c_prev_data_collection.next();
			var cur = null;
			var min = null;
			for ( var c in cs ){
				var diff = utils.diffVector(cs[c].loc , data.value.loc);
				if ( min === null || min > diff ) {
					cur = cs[c].name;
					min = diff;
				}
			}
			data.value.c = cur;
			data_collection.save(data);
//			data_collection.save({
//					_id:data._id,
//				value:{
//					loc:data.value.loc,
//					c:cur
//				}
//			});
		}

		var cluster_collection = _db.getCollection(cluster_collection_name);
		for ( var i in cs ) {
			var key = cs[i].name;
			var _c_data_collection = data_collection.find({'value.c' : key });
			var s = _c_data_collection.count();
 			var cluster = { name: key,s:s, loc:{} };
			var loc = {};
			while ( _c_data_collection.hasNext() ){
				var data = _c_data_collection.next();
				for ( var d in data.value.loc ) {
					if ( ! loc[d] ){
						loc[d] = 0;
					}
					loc[d] += data.value.loc[d];
				}				
			}
			var keys = Object.keys(loc).sort();
  		for ( var k in keys ) {
				var d = keys[k];
				cluster.loc[d] = loc[d]/s;
			}
			cluster_collection.save({
				_id:key,
				value:cluster
			});
		}

//		prev_data_collection.mapReduce (
//		function(){
//			var cur = null;
//			var min = null;
//			for ( var c in cs ){
//				var diff = utils.diffVector(cs[c].loc , this.value.loc);
//				if ( min === null || min > diff ) {
//					cur = cs[c].name;
//					min = diff;
//				}
//			}
//			emit(this._id,{loc:this.value.loc,c:cur} ); // emit key is unique so reduce will be skiped.
//		},
//		function(key,vals){
//			return vals[0]; // Maybe skip;
//		},
// 		{ 
//			out: data_collection_name,
//			scope:{
//				cs:cs,
//				utils:utils
//			}
//		});
//
//		data_collection.mapReduce (
//			function(){
//				emit(this.value.c,{name:this.value.c ,s:1,loc:this.value.loc});
//			},
//			function(key,vals){
// 				var ret = { name: key,s:0,loc:{} };
//				for ( var v in vals ) {
//					ret.s += vals[v].s;
//					for ( var d in vals[v].loc ) {
//						if ( ! ret.loc[d] ){
//							ret.loc[d] = 0;
//						}
//						ret.loc[d] += vals[v].loc[d];
//					}
//				}
//				return ret;
//			},
//		  { out: cluster_collection_name,
//				scope:{cs:cs},
//				finalize: function(key,val){
//  				for ( var d in val.loc ) {
//						val.loc[d] /= val.s;
//					}
//					return val;
//				}
//			});
		return [false,cluster_collection_name,data_collection_name];
	}

	var ret;
	var cs_history = {};
	for (var i = 0 ; i <= 99 ; i++ ) {
		print(' - ' + i);
		ret = iterate(i,cs_history);
		if ( ret[0] ) {
			break;
		}
	}
		_db.getCollection(ret[1]).renameCollection(fin_cluster_collection_name);
		_db.getCollection(ret[2]).renameCollection(fin_data_collection_name);

		_db.getCollection(fin_cluster_collection_name).findAndModify({
			query: {_id:'.meta'},
			update:{ $setOnInsert:{
				org: db.getName() + '.' + ns,
				data:fin_data_collection_name,
				cluster:fin_cluster_collection_name}},
			upsert:true
		});
		_db.getCollection(fin_data_collection_name).findAndModify({
			query: {_id:'.meta'},
			update:{ $setOnInsert:{
				org: db.getName() + '.' + ns,
				data:fin_data_collection_name,
				cluster:fin_cluster_collection_name}},
			upsert:true
		});


	return [fin_cluster_collection_name,fin_data_collection_name];
}



print('== KMEANS ==');
var _src_split  = _SRC.split('\.');
var _db         = _pmongo.getDB(_src_split.shift());
var SRC         = _src_split.join('\.');

var _cluster_split  = _CLUSTER.split('\.');
var _c_cluster = db.getMongo().getDB(_cluster_split.shift()).getCollection(_cluster_split.join('\.')).find();
var clusters = [];
while (_c_cluster.hasNext()){
	clusters.push(utils.getField(_c_cluster.next(),_CFIELD));
}
var kmeans_cluster = kmeans(_db,SRC,_VFIELD,clusters);
print(kmeans_cluster);
