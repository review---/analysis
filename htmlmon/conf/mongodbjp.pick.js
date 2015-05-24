exports.get = function() {
  return {
		SRC : {
			host: 'localhost',
			port: 27017,
			dbname: 'test',
			colname: 'mongodbjp',
			fieldname: 'body',
			query: {},
		},
		DST : {
			host: 'localhost',
			port: 27017,
			dbname: 'test',
			colname: 'mongodbjp.out',
		},
		FIELDS : {
			body: 'body'
		},
		MODIFY : function(doc) {
			return doc;
		}
  };
}
