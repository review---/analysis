exports.get = function() { 
  return {
    NODE    : '127.0.0.1:27017/htmlmon.mongodbjp',
    OUT     : '127.0.0.1:27017/htmlmon.mongodbjp.out',
    FIELD    : 'body',
    QUERY    : {},
		COND     : ['div.mainContents']
  };
}
