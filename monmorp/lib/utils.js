var utils = {
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
	array_in : function (arr,t){
		for ( var i in arr ) {
			if ( arr[i] === t ) {
				return true;
			}
		}
		return false;
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
	}
}
