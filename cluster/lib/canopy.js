// initial cluster
function canopy(_db,ns,field,def) {
	var fin_cluster_collection_name  = 'canopy.'+ns+'.fin.cluster';
	function iterate(n,cs_history) {
		var prev_cluster_collection_name = 'canopy.'+ns+'.it'+n+'.cluster';
		var cluster_collection_name      = 'canopy.'+ns+'.it'+(n+1)+'.cluster';
		var data_collection_name         = 'canopy.'+ns+'.data';

		if ( n == 0 ) {
			utils.cleanCollections('^canopy\.'+ns+'\.');
			_db.createCollection(cluster_collection_name);

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
//					// emit key is unique so reduce will be skiped.
//					var loc = utils.getField(this,field);
//					if ( loc ) {
//  					emit(this._id,{loc:loc} );
//					}
//  			},
//  			function(key,vals){
//          // Maybe skip
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
			return [false,cluster_collection_name];
		}
		var prev_cluster_collection = _db.getCollection(prev_cluster_collection_name);

		var cs = [];
		var _c_prev_cluster_collection = prev_cluster_collection.find();
		while ( _c_prev_cluster_collection.hasNext() ){
			cs.push(_c_prev_cluster_collection.next().value);
		}
		var md5sum = hex_md5(JSON.stringify(cs));
		if ( cs_history[md5sum] ) {
			return [true,prev_cluster_collection];
		}
		cs_history[md5sum] = n;
		// Add cluster
		var data_collection = _db.getCollection(data_collection_name);
		var _c_data_collection = data_collection.find();
		while ( _c_data_collection.hasNext() ){
			var data = _c_data_collection.next();
			var n = 0;
			for ( var c in cs ){
				var cluster = cs[c];
				var diff = utils.diffVector(cluster.loc,data.value.loc);
				if ( diff < def.t2 ) {
					n++;
					break;
				}
			}
			if ( n === 0 ) {
				prev_cluster_collection.save({value : { s : 0, loc : data.value.loc }	});
				cs.push({ s : 0, loc : data.value.loc });
			}
		}

		data_collection.mapReduce (
			function(){
				for ( var c in cs ){
					var cluster = cs[c];
					var diff = utils.diffVector(cluster.loc,this.value.loc);
					if ( diff < def.t1 ) {
						emit(c,{s:1,loc:this.value.loc} );
					}
				}
			},
			function(key,vals){
 				var ret = { s:0,loc:{} };
				for ( var v in vals ) {
					ret.s += vals[v].s;
					for ( var d in vals[v].loc ) {
						if ( ! ret.loc[d] ){
							ret.loc[d] = 0;
						}
						ret.loc[d] += vals[v].loc[d];
					}
				}
				return ret;
			},
   		{ 
				out: { merge : cluster_collection_name},
				scope: {
					cs:cs,
					def:def,
					utils:utils
				},
				finalize: function(key,val){
					val.loc = utils.normalize(val.loc);
					return val;
				}
			});

		var cluster_collection = _db.getCollection(cluster_collection_name);
		// Reduce minor
		var threshold = data_collection.stats().count / cluster_collection.count() * def.threshold;
		cluster_collection.ensureIndex({'value.s':1});
		cluster_collection.remove({'value.s':{ $lte : threshold}});
		cluster_collection.dropIndex({'value.s':1});
		// Reduce closed
		var newcs = []
		var _c_cluster_collection = cluster_collection.find();
		while ( _c_cluster_collection.hasNext() ){
			newcs.push(_c_cluster_collection.next().value);
		}
		for ( var c in newcs ) {
			var cluster = newcs[c];
			if ( cluster ) {
				var best = c;
				var s = cluster.s;
				for ( var i in newcs ) {
					var cmp = newcs[i];
					if ( cmp ) {
						var diff = utils.diffVector( cluster.loc, cmp.loc );
						if ( diff < def.t2 ) {
							if ( s < cmp.s ) {
								s = cmp.s;
								best = i;
							}
							newcs[i] = null;
						}
					}
				}
				newcs[best] = cluster;
			}
		}
		cluster_collection.drop();
		var num = 0;
		for ( var c in newcs ) {
			var cluster = newcs[c];
			if ( cluster ) {
				cluster_collection.save({value:cluster});
				num++;
			}
		}
		print('Num clusters : ' + num);
		return [false,cluster_collection_name];
	}

	var ret;
	var cs_history = {};
	for (var i = 0 ; i <= 1 ; i++ ) {
		print(' - ' + i);
		var ret = iterate(i,cs_history);
		if ( ret[0] ) {
			break;
		}
	}
		_db.getCollection(ret[1]).renameCollection(fin_cluster_collection_name);

	return fin_cluster_collection_name;
}


print('== CANOPY ==');

var _src_split  = _SRC.split('\.');
var _db = _pmongo.getDB(_src_split.shift());
var SRC         = _src_split.join('\.');

var canopy_cluster = canopy(_db,SRC,_VFIELD,{t2:_T2,t1:_T1,threshold:_THRESHOLD});

var meta = _db.getCollection(SRC).findOne({_id:'.meta'},{_id:0});
meta.vector = _SRC;
_db.getCollection(canopy_cluster).findAndModify({
	query: {_id:'.meta'},
	update:{ $setOnInsert:meta},
	upsert:true
});


print(canopy_cluster);
