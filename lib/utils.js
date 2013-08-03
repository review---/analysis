var _pmongo = db.getMongo();
if ( ! rs.isMaster().ismaster ) {
	for ( var i in rs.status().members ) {
		var member = rs.status().members[i];
		if ( member.state === 1 ) {
			var conn = connect(member.name+'/'+db.getName());
			_pmongo = conn.getMongo();
			rs.slaveOk();
			break;
		}
	}
}

var utils = {
	META :        {_id:'.meta'},
	IGNORE_META : {_id:{'$ne':'.meta'}},
	getmeta: function(src){
		var meta = src.findOne(utils.META,{_id:0});
		if ( ! meta ){
			meta = {};
		}
		return meta;
	},
	setmeta: function(dst,meta){
		return dst.findAndModify({
			query: utils.META,
			update:{ $setOnInsert:meta},
			upsert:true,
			new: true
		});
	},
	reset_job: function (c_src,job,field){
		if ( ! field ) {
			field = '_id';
		}
		job.drop();
		while ( c_src.hasNext()){
			var doc = c_src.next();
			doc.st = 0;
			doc._id = utils.getField(doc,field);
			job.insert(doc);
		}
		job.ensureIndex({st:1});
	},
	get_job: function(job){
		return job.findAndModify({
			query: {st:0},
			update:{ $set:{st:1}}
		});
	},
	end_job: function(job,id){
		job.update({_id:id},{st:2});
	},
	is_done_job: function(job){
			return (job.find({st:1}).limit(1).count() === 0);
	},
	waitfor_job: function(job){
		while(true){
			if ( utils.is_done_job(job) ) {
				break;
			}
			sleep(300);
		}
		return;
	},
	unique : function(arr){
		var u = {};
		var ret = [];
		for ( var i in arr ){
			if ( ! u[arr[i]] ) {
				u[arr[i]] = 1;
				ret.push(arr[i]);
			}
		}
		return ret;
	},
//	reduce : function(arr){
//		var u = {};
//		for ( var i in arr ){
//			var heads = utils.heads(arr[i],arr[i].length);
//			for ( var h in heads ) {
//				var head = heads[h];
//				if ( head.length===arr[i].length ) {
//					u[head] = 2;
//				}else  {
//					u[head] = 1;
//				}
//			}
//		}
//		var ret = [];
//		for ( var w in u ){
//			if ( u[w] === 2 ) {
//				ret.push(w);
//			}
//		}
//		return ret;
//	},
	// @@@ Array.sort seems like work well...
	sort : function(arr,comparator){
		if ( arr.length < 1 ) {
			return arr;
		}
		var c=arr.shift();
		var b=[];
		var a=[];
		for ( var i in arr ) {
			if ( comparator(arr[i],c) ) {
				b.push(arr[i]);
			}else{
				a.push(arr[i]);
			}
		}
		return utils.sort(b,comparator).concat(c).concat(utils.sort(a,comparator));
	},
	array_in : function (arr,t){
		for ( var i in arr ) {
			if ( arr[i] === t ) {
				return true;
			}
		}
		return false;
	},
	heads : function ( arr, n ) {
		var ret = [];
		for ( var i = ((arr.length<n)?arr.length:n) ; i >= 1 ; i-- ){
			ret.push(arr.slice(0,i));
		}
		return ret;
	},
	hash_merge_sum : function(a,b){
		for ( var i in b ) {
			if ( ! ( i in a ) ) {
				a[i] = 0;
			}
			a[i] += b[i];
		}
		return a;
	},
	hash_count: function (a) {
		var n = 0;
		for ( var i in a ) {
			n++;
		}
		return n;
	},
	getField : function(data,field) {
		function get(d,f){
			var k = f.shift();
			var c = d[k];
			if ( f.length === 0 ) { 
				return c; 
			}
			return get(c,f);
		}
		return get(data,field.split('\.'));
	},
	cleanCollections : function (ns){
		var collections = db.getCollectionNames();
		for ( var c in collections ) {
			var name = collections[c];
			var re = new RegExp(ns);
			if ( name.match(re) ){
				db.getCollection(name).drop();
			}
		}
	},
	addVector: function (loc1,loc2){
		for( var d in loc2 ) {
			if ( !(d in loc1) ) {
				loc1[d] = 0;
			}
			loc1[d] += loc2[d];
		}
		return loc1;
	},
	diffVector: function (loc1,loc2){
		function pow2(v){
			return v * v;
		}
		var dist = 0;
		for( var d in loc1 ) {
			dist += pow2(loc1[d]-((loc2[d])?loc2[d]:0));
		}
		for( var d in loc2 ) {
			if ( !(d in loc1) ) {
				dist += pow2(loc2[d]);
			}
		}
		return Math.sqrt(dist/2);
	},
	normalize: function(vec,div){
		if ( ! div ) {
			var diff = 0;
			for ( var v in vec ) {
				diff += vec[v]*vec[v];
			}
			div = Math.sqrt(diff);
		}
		for ( var v in vec ) {
			vec[v] /= div;
		}
		return vec;
	},
	getCollection : function(ns){
		var ns_split  = ns.split('\.');
		return db.getMongo().getDB(ns_split.shift()).getCollection(ns_split.join('\.'));
	},
	getWritableCollection : function(ns){
		var ns_split  = ns.split('\.');
		return _pmongo.getDB(ns_split.shift()).getCollection(ns_split.join('\.'));
	}
//	setField : function(data,field,set) {
//		function set(d,f){
//			var k = f.shift();
//			if ( f.length === 0 ) { 
//				d[k] = s;
//			}
//			return set(d[k],f);
//		}
//		return set(data,field.split('\.'));
//	}
}

