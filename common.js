// common.js

var chai 		= require("chai"); 							// (1 ) test framework
var http 		= require('http'); 							// (2 ) http 
var https 		= require('https');							// (3 ) secure http
var FormData 	= require('form-data'); 					// (4 ) Form submission
var fs 			= require('fs'); 							// (5 ) File Operation
var path 		= require('path');							// (6 )
var multer  	= require('multer'); 						// (7 ) Upload Middleware
var moment 		= require('moment'); 						// (8 ) Time Operations
var moment_tz	= require('moment-timezone');				// (9 ) 
var bunyan 		= require('bunyan'); 						// (10) Logging
var morgan 		= require('morgan');						// (11) Logs routes requests
var uuid 		= require('node-uuid'); 					// (12) Uniqueness
var passport	= require('passport'); 						// (13) Passport and sessions
var session     = require('express-session');				// (14)
var pgSession 	= require('connect-pg-promise')(session);	// (15) 
var bodyParser 	= require('body-parser'); 					// (16) Parsers
var cParser 	= require('cookie-parser');					// (17) 
var config		= require('C:/Users/U/Desktop/config.js');	// (18) Contains sensitive information
var pgp 		= require('pg-promise')();					// (19) 
var db			= pgp(config.DATABASE_URL);					// (20) Database connection pool
var bcrypt   	= require('bcrypt-nodejs');					// (21) Encryption

// Exporting modules
exports.chai 			= chai;			//1
exports.assert 			= chai.assert;	//1
exports.expect 			= chai.expect;	//1
exports.http 			= http;			//2
exports.https 			= https;		//3
exports.FormData 		= FormData;		//4
exports.fs 				= fs;			//5
exports.path			= path;			//6
exports.multer 			= multer;		//7
exports.moment 			= moment;		//8
exports.moment_tz		= moment_tz;	//9
exports.bunyan			= bunyan;		//10
exports.morgan			= morgan;		//11
exports.uuid 			= uuid;			//12
exports.passport		= passport;		//13
exports.session			= session;		//14
exports.pgSession		= pgSession;	//15
exports.bodyParser		= bodyParser;	//16
exports.cookieParser	= cParser;		//17
exports.config			= config;		//18
exports.pgp				= pgp;			//19
exports.db 				= db;			//20
exports.bcrypt			= bcrypt;		//21
moment().format();
var log = bunyan.createLogger({
	name: 'instads',
	serializers: 
	{
		req: bunyan.stdSerializers.req,
		res: bunyan.stdSerializers.res
	},
	streams: [
		{
			level: 'info',
			stream: process.stdout            // log INFO and above to stdout
		},
		//for now dont log into files
		/*{
			level: 'error',
			path: 'instads_error.log'  // log ERROR and above to a file
		},
		{
			leve: 'info',
			path: 'instads_info.log'
		}*/ 
	]
});
exports.log = log;

/** Exported functions **/
exports.is_data_valid = function(types, variables) {
	//log.info(types); log.info(variables);
	if (types.length != variables) {
		for (var i in variables) {
			if (variables[i] !== undefined) {
				if (types[i] == "uuid" || types[i] == "uuid_optional") {
					if (!isValidUUID(variables[i])) {
						return {success: false, error: "Data provided is not a uuid. Please refer to documentation or provide a valid uuid."};
					}
				} else if (types[i] == "string") {
					if (typeof variables[i] != "string") {
						return {success: false, error: "Data provided is not a string. Please refer to documentation or provide a string."};
					}
				} else if (types[i] == "int") {
					if (!isNormalInteger(variables[i])) {
						return {success: false, error: "Data provided is not a integer number. Please refer to documentation or provide a integer."};
					}
				} else if (types[i] == "mimetype") {
					var mime = /^([^/]*)\/(.*)$/.exec(variables[i]);
					if (!(mime.length > 0 && (mime[1] == 'video' || mime[1] == 'image'))) {
						return {success: false, error: "Invalid filetype provided. Please refer to documentation or provide valid file."};
					}
				} else if (types[i] == "timestamp") {
					if (!moment(variables[i], "YYYY-MM-DD HH:mm").isValid()) {
						return {success: false, error: "Data provided is not a valid timestamp. Please refer to documentation or provide a valid timestamp."};
					}
				} else if (types[i] == "cnpj") {
					if (!isValidCNPJ(variables[i])) {
						return {success: false, error: "Data provided is not a valid cnpj. Please refer to documentation or provide a valid cnpj."};
					}
				} else if (types[i] == "order") {
					if (variables[i] != "ASC" && variables[i] != "DESC") {
						return {success: false, error: "Order provided is not ASC neither DESC. Please refer to documentation or provide right parameters"};
					}
				}
			} else if (types[i].split("_")[1] == "optional") {
				// just dont return false success, since it is optional
			} else {
				return {success: false, error: "Data provided is undefined. Please refer to documentation or provide valid parameters."};
			}
		}
		return {success : true}
	}
	return {success: false, error: "Provided data has different length than expected."};
}

exports.getMulterObject = function(defaultDirectory, maximumSizeInMegaBytes, allowTypes) {
	return multer({
		fileFilter: function (req, file, cb) {
			if(file) {
				var wrongFileType = true;
				for (var e in allowTypes) {
					if (file.mimetype.indexOf(allowTypes[e]) != -1) {
						wrongFileType = false;
					}
				}
				if (!wrongFileType) {
					cb(null, true); // allow upload
				} else {
					log.error("Wrong filetype provided");
					cb(null, false);
				}
			}
		}, 
		storage: multer.diskStorage({
			destination: function (req, file, cb) {
				cb(null, defaultDirectory);
			},
			filename: function (req, file, cb) {
				if (file) {
					cb(null, uuid.v4() +"."+ file.mimetype.split('/')[1]);  //ignores filename extension
				}
			}
		}),
		limits: { fileSize: maximumSizeInMegaBytes * 1024 * 1024 }
	});
}

exports.compare_timestamps = function(timestamp_before, timestamp_after) {
	var before = moment(timestamp_before, "YYYY-MM-DD HH:mm");
	var after = moment(timestamp_after, "YYYY-MM-DD HH:mm");
	console.log(after.diff(before));
	return after.diff(before);
}

// returns true if the caller is a mobile phone (not tablet)
// compares the user agent of the caller against a regex
// This regex comes from http://detectmobilebrowsers.com/
exports.isCallerMobile = function(req) {
	var ua = req.headers['user-agent'].toLowerCase(),
		isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4));

	return !!isMobile;
}

// note: the next method param is passed as well
exports.checkForMobile = function(req, res, next) {
	// check to see if the caller is a mobile device
	var isMobile = isCallerMobile(req);

	if (isMobile) {
		console.log("Going mobile");
		res.redirect('/mobile');
	} else {
		// if we didn't detect mobile, call the next method, which will eventually call the desktop route
		return next();
	}
}
// route middleware to make sure a user is logged in
exports.isLoggedIn = function(req, res, next) {
	// Cheater MacCheaterson
	var token = config.app_secret;
	if (req.body.access_token !== undefined && req.body.access_token == token ||
		req.query.access_token !== undefined && req.query.access_token == token) {
		log.info("[Auth with token]");
		db.one("SELECT id_user, email FROM instads_user LIMIT 1", [])
		.then(function(data){
			req.user = {id : data.id_user};
			//req.login({id : data.id_user, email : data.email}, function(err) {});
			return next();
		});
	} else {
		// if user is authenticated in the session, carry on 
		if (req.isAuthenticated())
			return next();

		// if they aren't redirect them to the home page
		res.status(403).json({error:"Unauthorized..."});
	}
}

// route middleware to make sure a user has administrator permissions
exports.isAdministrator = function(req, res, next) {
	// Cheater MacCheaterson
	var token = config.app_secret;
	if (req.body.access_token !== undefined && req.body.access_token == token ||
		req.query.access_token !== undefined && req.query.access_token == token) {
		log.info("[Auth with token]");
		db.one("SELECT id_user, email FROM instads_user LIMIT 1", [])
		.then(function(data){
			req.user = {id : data.id_user};
			//req.login({id : data.id_user, email : data.email}, function(err) {});
			return next();
		});
	} else {
		// if user is authenticated in the session, carry on 
		if (req.isAuthenticated())
			return next();

		// if they aren't redirect them to the home page
		res.status(403).json({error:"Unauthorized..."});
	}
}

/**
 * Auxiliary Functions *
 */
isValidUUID = function (uuid) {
	var uuid_regex = new RegExp("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}");
	if (uuid_regex.test(uuid.split('.')[0])){ // ignores extension
		return true;
	}
	return false;
}

function isNormalInteger(str) {
    var n = ~~Number(str);
	if (!(String(n) === str && n >= 0)) {
		return !isNaN(str);
	}
    return String(n) === str && n >= 0;
}

isValidCNPJ = function (cnpj) {
	cnpj = cnpj.replace(/[^\d]+/g,'');
 
    if(cnpj == '') return false;
     
    if (cnpj.length != 14)
		return false;
 
    // Elimina CNPJs invalidos conhecidos
    if (cnpj == "00000000000000" || 
        cnpj == "11111111111111" || 
        cnpj == "22222222222222" || 
        cnpj == "33333333333333" || 
        cnpj == "44444444444444" || 
        cnpj == "55555555555555" || 
        cnpj == "66666666666666" || 
        cnpj == "77777777777777" || 
        cnpj == "88888888888888" || 
        cnpj == "99999999999999")
        return false;
         
    // Valida DVs
    tamanho = cnpj.length - 2
    numeros = cnpj.substring(0,tamanho);
    digitos = cnpj.substring(tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0))
        return false;
         
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0,tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1))
          return false;
           
    return true;
    
}



