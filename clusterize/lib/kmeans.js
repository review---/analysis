function Kmeans(src) {
	this.SRC = src;
	var src_split = src.split('\.');
	this.DB = src_split.shift();
	this.db = db.getMongo().getDB(this.DB);
	this.pdb= _pmongo.getDB(this.DB);
	this.NS = src_split.join('\.');
	this.FIN_C  = 'kmeans.'+this.NS+'.fin.cluster';
	this.FIN_D  = 'kmeans.'+this.NS+'.fin.data';
	this.cs_history = null;
	this.N = 0;
	this.J = 0;
	var _src = this.db.getCollection(this.NS);
	this.meta = _src.findOne({_id:'.meta'});
	if ( ! this.meta ){
		this.meta = {};
	}
}

Kmeans.prototype.clean = function(){
	utils.cleanCollections('^kmeans\.'+this.NS+'\.');
}

Kmeans.prototype.prepareIt = function(){
	this.PREV_C = 'kmeans.'+this.NS+'.it'+this.N+'.cluster';
	this.PREV_D = 'kmeans.'+this.NS+'.it'+this.N+'.data';
	this.CUR_C  = 'kmeans.'+this.NS+'.it'+(this.N+1)+'.cluster';
	this.CUR_D  = 'kmeans.'+this.NS+'.it'+(this.N+1)+'.data';

	this.PREV_J = this.CUR_J;
	this.CUR_J  = 'kmeans.'+this.NS+'.job'+(this.J++);
	if ( this.PREV_J ) {
		this._pjob  = this.db.getCollection(this.PREV_J);
		this.wait();
	}
	print(' - ' + this.N + ' : ' + this.J + ' ( ' + this.PREV_J);
	this._job   = this.pdb.getCollection(this.CUR_J);
	this._job.ensureIndex({done:1});
}

Kmeans.prototype.isVacant = function(id){
	var prev = this._job.findAndModify({
		query: {_id:id},
		update:{ $setOnInsert:{ tm:ISODate() , done:0}},
		upsert:true
	});
	if ( prev ) {
		return false;
	}
	return true;
}
Kmeans.prototype.done = function(id){
	this._job.update({_id:id},{ $set : { done : 1 } } );
}
Kmeans.prototype.wait = function(){
	while(true){
		if ( ! this._pjob.find({done:0}).count() ){
			break;
		}
		sleep(1000);
	}
}

Kmeans.prototype.getCluster = function(CLUSTER,FIELD){
	var cs = [];

	var _c_cluster = utils.getCollection(CLUSTER).find({_id:{'$ne':'.meta'}});
	while (_c_cluster.hasNext()){
		var cluster = utils.getField(_c_cluster.next(),FIELD);
		cs.push(cluster);
	}
	return cs;
}

Kmeans.prototype.first = function(CLUSTER,CFIELD,VFIELD){
	this.prepareIt();

	if ( ! this.isVacant(0) ) {
		return;
	}

	var _cluster = this.pdb.getCollection(this.CUR_C);
	var cs = this.getCluster(CLUSTER,CFIELD);
	for ( var c in cs ) {
		var cluster = { name : c , s : 0, loc : cs[c] } ;
			_cluster.save({ value : cluster});
	}
	var _data = this.pdb.getCollection(this.CUR_D);
	var _src = this.db.getCollection(this.NS);
	var _c_src = _src.find({_id:{'$ne':'.meta'}});
	while(_c_src.hasNext()){
		var data = _c_src.next();
		var loc  = utils.getField(data,VFIELD);
		if ( loc ) {
			_data.save({
					_id:data._id,
				value:{loc:loc}
			});					
		}
	}
	this.done(0);
}
Kmeans.prototype.dataIterate = function(){
	this.N++;
	this.prepareIt();

	var cs = this.getCluster(this.DB+'.'+this.PREV_C,'value');
	if ( ! cs.length ) {
		return false;
	}
	if ( this.cs_history ){
		var cdiff = 0;
		for ( var c in cs ){
			cdiff += utils.diffVector(cs[c].loc,this.cs_history[c].loc);
		}	
		print('Cluster diff: '+cdiff);
		if ( cdiff < 1.0e-12 ) {
			return false;
		}
	}
		this.cs_history = cs;

	var _data = this.pdb.getCollection(this.CUR_D);
		_data.ensureIndex({'value.c':1});

	var _prev_data = this.db.getCollection(this.PREV_D);
	var _c_prev_data = _prev_data.find({},{_id:1});
	while(_c_prev_data.hasNext()){
		var id = _c_prev_data.next()._id;
		if ( ! this.isVacant(id) ) {
			continue;
		}
		var data = _prev_data.findOne({_id:id});

		var cur = null;
		var min = null;
		var cssum     = 0;
		data.value.cs = [];

		for ( var c in cs ){
			var diff = utils.diffVector(cs[c].loc , data.value.loc);
			if ( min === null || min > diff ) {
				cur = cs[c].name;
				min = diff;
			}
			var score = Number.MAX_VALUE;
			if ( diff ) {
				score = 1/diff;
			}
			data.value.cs.push({c:c,s:score});
			cssum += score;
		}
			// data
		data.value.c  = cur;
		for ( var i in data.value.cs ){
			data.value.cs[i].s /= cssum;
			data.value.cs[i].s = (data.value.cs[i].s<1.0e-12)?0:data.value.cs[i].s;
		}
		data.value.cs = utils.sort(data.value.cs,function(a,b){ return a.s > b.s;});
		_data.save(data);
	
		this.done(id);
	}
	return cs;
}
Kmeans.prototype.clusterIterate = function(cs){
	this.prepareIt();
	var _data    = this.db.getCollection(this.CUR_D);
	var _cluster = this.pdb.getCollection(this.CUR_C);
	for ( var c in cs ) {
		if ( ! this.isVacant(c) ) {
			continue;
		}
		var newc = { name: c, s:0, loc:{} };
		var _c_data = _data.find({'value.c':c});
		while(_c_data.hasNext()){
			var data = _c_data.next();
			newc.loc = utils.addVector(newc.loc,data.value.loc);
			newc.s++;
		}
		if ( this.meta.normalize ) {
			newc.loc = utils.normalize(newc.loc);
		}else{
			for ( var d in newc.loc ) {
				newc.loc[d] /=  newc.s;
			}
		}
		_cluster.save({
				_id:c,
			value:newc
		});
		this.done(c);
	}
}

Kmeans.prototype.finish = function(){
	var prev_c = this.PREV_C;
	var prev_d = this.PREV_D;
	this.N = 99999;
	this.prepareIt();

	if ( ! this.isVacant(0) ) {
		return;
	}

	this.pdb.getCollection(prev_c).renameCollection(this.FIN_C);
	this.pdb.getCollection(prev_d).renameCollection(this.FIN_D);

	this.meta.vector = this.SRC;
	this.meta.data   = this.DB + '.' + this.FIN_D;
	this.meta.cluster= this.DB + '.' + this.FIN_C;
	delete(this.meta._id);
	this.pdb.getCollection(this.FIN_C).findAndModify({
		query: {_id:'.meta'},
		update:{ $setOnInsert:this.meta},
		upsert:true
	});
	this.pdb.getCollection(this.FIN_D).findAndModify({
		query: {_id:'.meta'},
		update:{ $setOnInsert:this.meta},
		upsert:true
	});
	printjson(this.meta);

	this.done(0);
}

var kmeans = new Kmeans(_SRC);
if ( _CJOB ) {
	kmeans.clean();
	quit();
}

print('== KMEANS ==');
kmeans.first(_CLUSTER,_CFIELD,_VFIELD);
for (var i = 0 ; i <= 99 ; i++ ) {
	var cs = kmeans.dataIterate();
	if ( ! cs ) {
		break;
	}
	kmeans.clusterIterate(cs);
}
kmeans.finish();
