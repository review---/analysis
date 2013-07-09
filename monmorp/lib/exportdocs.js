var _test_name = _COL.split('\.');
var _doc  = db.getMongo().getDB(_test_name.shift()).getCollection(_test_name.join('\.'));
var docs = _doc.find();
while ( docs.hasNext()){
	var doc = docs.next();
	print ('ObjectId("'+ doc._id + '")' + ' ' + utils.getField(doc,_BODY).split("\n").join(''));
}