var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/education');

var collection_ps = db.get('ps');



function give_lab(username){
	collection_ps.findOne({username:username}, {}, function(err, user_ps){
		if(err || !user_ps){
			console.log("something went wrong");
		}else{
			collection_ps.update({username:username},{$set:{"labs.lab10.complete":true}});
		}
	});
}

var people = ['fmdestin', 'ousmanka', 'guangxin', 'wmsaulon', 'blakebue', 'annakobi', 'njceccar', 'wp26', 'jenniech', 'spittaro', 'seanjone', 'sanairac', 'bs84', 'vbaziuk', 'alphonsu', 'jamiesau', 'jchen338', 'rejankow', 'yli55', 'jzheng47', 'szheng32', 'mmmcnaug', 'irclark', 'jalmazan', 'mvciacci', 'btmccann', 'djin3', 'elbiltek', 'abrewer2', 'ifrankli', 'bcastell', 'mpriley', 'ethanhul', 'mmcaccam', 'skylarla', 'averywei', 'ziaochen', 'oscarasb', 'aamcclin', 'vtattyba', 'dszczepa', 'wtmills', 'swreming', 'afcovert', 'temeosky', 'sethschu', 'dm235', 'apszolno', 'dannenro', 'djbrior', 'alexisse', 'anmolpat', 'cullenga', 'usmanhus', 'ibarry2', 'badisben', 'svreid2', 'gtcodign', 'narmeena', 'kendall5', 'mjspagna', 'jeandedi', 'mjolenic', 'susanpau', 'drewfiut', 'bjho', 'aarondie', 'bfrawley', 'afuchs2', 'dmbritta', 'jlvella', 'karencru', 'djwhite5', 'jconoh', 'votreesh', 'ldong7', 'zhang77', 'devonwan', 'hchen63', 'sterlynr', 'vtjutton', 'zdgandro', 'aarondom', 'sli84', 'ancruz', 'dylanmah', 'jlsanton', 'sjlevano', 'weikengf', 'jlau28', 'coyotero', 'gli24', 'epwood', 'yusong', 'sandrash', 'msillah', 'camilare', 'njchorda', 'jlu42', 'dhuang34', 'seanbras', 'cvlada', 'jrwelch2', 'ncolan', 'boyuanch', 'xueweiji', 'dtschill', 'lukekuch', 'rmichel', 'avrilall', 'shivamti', 'jtfeasle', 'caseywhe', 'bsterp', 'hkowthee', 'fabianra', 'dmawer', 'evarnazi', 'mohanvel', 'valinama', 'tamaghan', 'nitishdh', 'aosaliu', 'vernoncy', 'dvdonato', 'sahajpat', 'ctscholl', 'shengkeh', 'apcox', 'agkahane', 'arojo', 'njlucare', 'artemlos', 'dmshekht', 'alpalumb', 'brmannix', 'rickthom', 'wfnichol', 'tswong', 'messiahs', 'eliu4', 'paulstew', 'zarifkha', 'joanlee', 'alexturn', 'slin42', 'zlin23', 'jshi8', 'struong', 'brianguz', 'yli283', 'zhuotaoc', 'bernyros', 'jerasakm', 'jjklein2', 'fchen32', 'sjreeb', 'wrmolini', 'cddunbar', 'mcouarin', 'jpryan2', 'liamsauv', 'yinuoche', 'zchen55', 'tqchan', 'jlittere', 'zepinghe', 'huiyuanz', 'stevegle', 'muntaqam', 'jliang32', 'mjthurst', 'rmccarth', 'ryantang', 'xuanhuaz'];


for(var i=0; i<people.length; i++){
	var ubit = people[i];
	console.log(ubit);
	give_lab(ubit);
}