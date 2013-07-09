var _dictionary_name = _DIC.split('\.');
var _db = db.getMongo().getDB(_dictionary_name.shift());

var _DICTIONARY     = _dictionary_name.join('\.');
var _dictionary = _db.getCollection(_DICTIONARY);

_dictionary.update({t: ["動詞","接尾"] },{'$set': { t:["助動詞"]} } , { multi:true});
_dictionary.update({w: "たがる" },{'$set': { t:["助動詞"]} });

_dictionary.remove({w:"呼ばれる"});
_dictionary.remove({w:"０"});
_dictionary.remove({w:"１"});
_dictionary.remove({w:"２"});
_dictionary.remove({w:"３"});
_dictionary.remove({w:"４"});
_dictionary.remove({w:"５"});
_dictionary.remove({w:"６"});
_dictionary.remove({w:"７"});
_dictionary.remove({w:"８"});
_dictionary.remove({w:"９"});
_dictionary.remove({w:"一"});
_dictionary.remove({w:"二"});
_dictionary.remove({w:"三"});
_dictionary.remove({w:"四"});
_dictionary.remove({w:"五"});
_dictionary.remove({w:"六"});
_dictionary.remove({w:"七"});
_dictionary.remove({w:"八"});
_dictionary.remove({w:"九"});
_dictionary.remove({w:"〇"});
_dictionary.remove({w:"，"});
_dictionary.remove({w:"．"});
_dictionary.remove({w:"十"});
_dictionary.remove({w:"百"});
_dictionary.remove({w:"千"});
_dictionary.remove({w:"万"});
_dictionary.remove({w:"億"});
_dictionary.remove({w:"兆"});
_dictionary.remove({w:"＋"});
_dictionary.remove({w:"－"});
_dictionary.remove({w:"×"});
_dictionary.remove({w:"÷"});
_dictionary.remove({w:"√"});
_dictionary.remove({w:"、",t:{'$in':["名詞"]}});
