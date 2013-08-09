function Kmeans(src) {
	this.SRC = src;
	var src_split = src.split('\.');
	this.DB = src_split.shift();
//	this.db = db.getMongo().getDB(this.DB);
//	this.pdb= _pmongo.getDB(this.DB);
	this.NS = src_split.join('\.');
	this.FIN_C  = 'kmeans.'+this.NS+'.fin.cluster';
	this.FIN_D  = 'kmeans.'+this.NS+'.fin.data';
	this.cs_history = null;
	this.N = 0;
	this._src = utils.getCollection(this.SRC);
	this.meta=	utils.getmeta(this._src);
}

Kmeans.prototype.clean = function(){
	utils.cleanCollections('^kmeans\.'+this.NS+'\.');
}

Kmeans.prototype.prepareIt = function(){
	this.PREV_C = this.DB + '.' + 'kmeans.'+this.NS+'.it'+this.N+'.cluster';
	this.PREV_D = this.DB + '.' + 'kmeans.'+this.NS+'.it'+this.N+'.data';
	this.CUR_C  = this.DB + '.' + 'kmeans.'+this.NS+'.it'+(this.N+1)+'.cluster';
	this.CUR_D  = this.DB + '.' + 'kmeans.'+this.NS+'.it'+(this.N+1)+'.data';
	this.CUR_J  = this.DB + '.' + 'kmeans.'+this.NS+'.it'+(this.N+1)+'.job';
	this.CUR_CJ = this.DB + '.' + 'kmeans.'+this.NS+'.it'+(this.N+1)+'.cluster.job';
	this.CUR_DJ = this.DB + '.' + 'kmeans.'+this.NS+'.it'+(this.N+1)+'.data.job';
	this._prev_d= utils.getCollection(this.PREV_D);
  this._prev_c= utils.getCollection(this.PREV_C);
	this._djob  = utils.getWritableCollection(this.CUR_DJ);
  this._cjob  = utils.getWritableCollection(this.CUR_CJ);
	this.N++;
}

Kmeans.prototype.is_vacant = function(no){
	var _job = utils.getWritableCollection(this.CUR_J+'_'+no);
	_job.ensureIndex({st:1});
	var prev = _job.findAndModify({
		query: utils.META,
		update:{ $setOnInsert:{st:1}},
		upsert:true
	});	
	if ( prev ) {
		return false;
	}
	return true;
}
Kmeans.prototype.done = function(no){
	utils.getWritableCollection(this.CUR_J+'_'+no).update(utils.META,{ $set : { st : 2 } } );
}

Kmeans.prototype.waitForJob = function(no){
//	print('== waitForJob ==');
	utils.waitfor_jobs(utils.getWritableCollection(this.CUR_J+'_'+no));
}
Kmeans.prototype.waitForData = function(){
//	print('== waitForData ==');
	utils.waitfor_jobs(utils.getCollection(this.CUR_DJ));
}
Kmeans.prototype.waitForCluster = function(){
//	print('== waitForCluster ==');
	utils.waitfor_jobs(utils.getCollection(this.CUR_CJ));
}
//Kmeans.prototype.isVacant = function(id){
//	var prev = this._job.findAndModify({
//		query: {_id:id},
//		update:{ $setOnInsert:{ done:0}},
//		upsert:true
//	});
//	if ( prev ) {
//		return false;
//	}
//	return true;
//}
//Kmeans.prototype.wait = function(){
//	while(true){
//		if ( ! this._pjob.find({done:0}).count() ){
//			break;
//		}
//		sleep(1000);
//	}
//}
//Kmeans.prototype.done = function(id){
//	this._job.update({_id:id},{ $set : { done : 1 } } );
//}


Kmeans.prototype.getCluster = function(CLUSTER,FIELD){
	var cs = [];
	var _c_cluster = utils.getCollection(CLUSTER).find(utils.IGNORE_META);
	while (_c_cluster.hasNext()){
		var cluster = utils.getField(_c_cluster.next(),FIELD);
		cs.push(cluster);
	}
	return cs;
}

// Comvert from datacol to kmeans.data
Kmeans.prototype.first = function(CLUSTER,CFIELD,VFIELD){
	var JOBID = 0;
	if ( this.is_vacant(JOBID) ) {
		print('== first ==');
		var _cluster = utils.getWritableCollection(this.CUR_C);
		var cs = this.getCluster(CLUSTER,CFIELD);
		for ( var c in cs ) {
			var cluster = { name : c , s : 0, loc : cs[c] } ;
				_cluster.save({ value : cluster});
		}
		var _data = utils.getWritableCollection(this.CUR_D);
		
		var _c_src = this._src.find(utils.IGNORE_META);
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
		this.done(JOBID);
	}
	this.waitForJob(JOBID);
}

Kmeans.prototype.createJob = function(){
	var JOBID = 1;
	if ( this.is_vacant(JOBID) ) {
		print('== createJob ( '+this.N+' ) ==');
  	// Data job
  	var _c_prev_data = this._prev_d.find(utils.IGNORE_META,{_id:1});
  	utils.reset_job(_c_prev_data,this._djob);
  	// Cluster job
		var _c_prev_cluster = this._prev_c.find(utils.IGNORE_META,{_id:1});
		utils.reset_job(_c_prev_cluster,this._cjob);
		this.done(JOBID);
	}
	this.waitForJob(JOBID);
}

Kmeans.prototype.dataIterate = function(){
	var cs = this.getCluster(this.PREV_C,'value');
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

	var _data = utils.getWritableCollection(this.CUR_D);
		_data.ensureIndex({'value.c':1});

//	var _prev_data = utils.getCollection(this.PREV_D);
//	var _c_prev_data = _prev_data.find({},{_id:1});
//	while(_c_prev_data.hasNext()){
//		var id = _c_prev_data.next()._id;
//		if ( ! this.isVacant(id) ) {
//			continue;
//		}
	while (true){
		var job = utils.get_job(this._djob);
		if ( ! job ) {
			break;
		}
		var data = this._prev_d.findOne({_id:job._id});
		
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
		utils.end_job(this._djob,job._id);
	}
	return cs;
}
Kmeans.prototype.clusterIterate = function(cs){
	var _data    = utils.getCollection(this.CUR_D);
	var _cluster = utils.getWritableCollection(this.CUR_C);
//	for ( var c in cs ) {
//		if ( ! this.isVacant(c) ) {
//			continue;
//		}
	while ( true ) {
		var job = utils.get_job(this._cjob);
		if ( ! job ) {
			break;
		}
		var c=utils.getField(
									 this._prev_c.findOne({_id:job._id},{_id:0,'value.name':1}),
									 'value.name');
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
		utils.end_job(this._cjob,job._id);
	}
}

Kmeans.prototype.finish = function(){
	var prev_c = this.PREV_C;
	var prev_d = this.PREV_D;

	var JOBID = 2;
	if ( this.is_vacant(JOBID) ) {
		utils.getWritableCollection(prev_c).renameCollection(this.FIN_C);
		utils.getWritableCollection(prev_d).renameCollection(this.FIN_D);
		
		this.meta.vector = this.SRC;
		this.meta.data   = this.DB + '.' + this.FIN_D;
		this.meta.cluster= this.DB + '.' + this.FIN_C;
		delete(this.meta._id);
		utils.setmeta(utils.getWritableCollection(this.meta.cluster),this.meta);
		utils.setmeta(utils.getWritableCollection(this.meta.data),this.meta);
		printjson(this.meta);
		
		this.done(JOBID);
	}
	this.waitForJob(JOBID);
}

var kmeans = new Kmeans(_SRC);

if ( _CJOB ) {
	kmeans.clean();
	quit();
}

print('== KMEANS ==');
kmeans.prepareIt();
kmeans.first(_CLUSTER,_CFIELD,_VFIELD);
for (var i = 0 ; i <= 99 ; i++ ) {
	kmeans.prepareIt();
	kmeans.createJob();
	var cs = kmeans.dataIterate();
	if ( ! cs ) {
		break;
	}
	kmeans.waitForData();
	kmeans.clusterIterate(cs);
	kmeans.waitForCluster();
}
kmeans.finish();
