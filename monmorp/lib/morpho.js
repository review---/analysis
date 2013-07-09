var morpho = {
	re_date1   : /^([０１２３４５６７８９一二三四五六七八九〇十]+[年月日時分秒])/,
	re_date2   : /^[０１２３４５６７８９]+([：／－　 ][０１２３４５６７８９]+)+/,
	re_number1 : /^[＋－]?[０１２３４５６７８９][０１２３４５６７８９十百千万億兆，．]*/,
  //re_number2 : /^[一二三四五六七八九〇十百千][一二三四五六七八九〇十百千万億兆，．]*/,
	re_suru : /する$/,
	re_zuru : /ずる$/,
	forms   : function(val){
		function gen(val,n,arr1,arr2,arr3){
			var base = val.w.substring(0,val.w.length-n);
			val.w = [val.w];
			// default
			if ( ! val.f[val.w] ) {
				val.f[val.w] = [];
			}
			val.f[val.w].push(1);
//			if ( utils.array_in(val.t,"動詞") ) {
//				val.f[val.w].push(4);
//			}
			// endable
			for ( var i in arr1 ) {
				val.w.push(base + arr1[i]);
				if ( ! val.f[base + arr1[i]] ) {
					val.f[base + arr1[i]] = [];
				}
				val.f[base + arr1[i]].push(1);
				val.f[base + arr1[i]] = utils.unique(val.f[base + arr1[i]]);
			}
			// follow ppp
			for ( var i in arr2 ) {
				val.w.push(base + arr2[i]);
				if ( ! val.f[base + arr2[i]] ) {
					val.f[base + arr2[i]] = [];
				}
				val.f[base + arr2[i]].push(2);
				val.f[base + arr2[i]] = utils.unique(val.f[base + arr2[i]]);
			}
			// follow verb
			for ( var i in arr3 ) {
				val.w.push(base + arr3[i]);
				if ( ! val.f[base + arr3[i]] ) {
					val.f[base + arr3[i]] = [];
				}
				val.f[base + arr3[i]].push(3);
				val.f[base + arr3[i]] = utils.unique(val.f[base + arr3[i]]);
			}
			val.w = utils.unique(val.w);
			// val.l = (val.l===1 )?1:(val.l-1);
			return val;
		}
		if ( utils.array_in(val.t,"動詞") ) {
			if        (  val.w === "ける" ) {
			}	else if ( val.w === "げる" ) {
			}	else if ( val.w === "たす" ) {
			}	else if ( val.w === "ねる" ) {
			}	else if ( val.w === "ばる" ) {
			}	else if ( val.w === "める" ) {
			}	else if ( val.w === "らす" ) {
			}	else if ( val.w === "くる" ) {
				return gen(val,2,["こい"],["くれ","き"],["き"]);
			}	else if ( val.w === "来る" ) {
				return gen(val,1,["い"],["れ",""],[""]);
			} else if ( val.w.match(this.re_suru) ) {
				return gen(val,2,["しろ","せよ"],["する","すれ","さ","し","せ"],["し"]);
			} else if ( val.w.match(this.re_zuru) ) {
				return gen(val,2,["じろ","ぜよ"],["ずる","ずれ","じ","ぜ"],["じ"]);
			}	else if (val.l > 1 && val.w[val.l-1] === "る" && 
								 utils.array_in(["イ","キ","ギ","ジ","チ","ニ","ヒ","ビ","ミ","リ","エ","ケ","セ","ゼ","テ","デ","ネ","ヘ","ベ","メ","レ"],val.p[0][val.p[0].length-2]) ){
				return gen(val,1,["ろ","よ"],["る","れ",""],[""]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "う" ) {
				return gen(val,1,["える","え"],["お","わ","い","っ","う","え"],["い"]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "く" ) {
				return gen(val,1,["ける","け"],["こ","か","き","い","く","け"],["き"]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "ぐ" ) {
				return gen(val,1,["げる","げ"],["ご","が","ぎ","い","ぐ","げ"],["ぎ"]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "す" ) {
				return gen(val,1,["せる","せ"],["そ","さ","し","す","せ"],["し"]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "つ" ) {
				return gen(val,1,["てる","て"],["と","た","ち","っ","つ","て"],["ち"]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "ぬ" ) {
				return gen(val,1,["ねる","ね"],["の","な","に","ん","ぬ","ね"],["に"]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "ぶ" ) {
				return gen(val,1,["べる","べ"],["ぼ","ば","び","ん","ぶ","べ"],["び"]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "む" ) {
				return gen(val,1,["める","め"],["も","ま","み","ん","む","め"],["み"]);
			}	else if ( val.l > 1 && val.w[val.l-1] === "る" ) {
				return gen(val,1,["れる","れ"],["ろ","ら","り","っ","る","れ"],["り"]);
			}
		}	else if ( utils.array_in(val.t,"助動詞") ) {
			if        ( val.w === "ます" ){
				return gen(val,1,[],["すれ","しょ","し","せ"],[]);
			} else if ( val.w === "です" ){
				return gen(val,1,[],["しょ","し"],[]);
			} else if ( val.w === "たがる" ){
    		return gen(val,1,["り"],["ら","り","っ","れ"],[]);
			} else if ( val.w === "ぬ" ){
    		return gen(val,1,["ず","ん"],["ね"],[]);
			} else if ( val.l > 1 && val.w[val.l-1] === "る" ) {
				return gen(val,1,["れ",""],["れ","ろ","よ",""],[]);
			} else if (val.w === "ない" ||
								 val.w === "たい" ||
								 val.w === "らしい" ) {
    		return gen(val,1,[],["かろ","かっ","けれ"],["く"]);
			} else if ( val.w === "た" ){
				return gen(val,1,[],["たろ","たら"],[]);
			} else if ( val.w[val.l-1] === "だ" ) {
				return gen(val,1,["です","で","な"],["だろ","だっ","なら","だら"],["に"]);
			}
		}	else if ( utils.array_in(val.t,"形容詞") ) {
			if        ( val.w[val.l-1] === "い" ) {
				return gen(val,1,[],["かろ","かっ","けれ"],["く"]);
			}
		}
		return val;
	}
}