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
	log.info(types); log.info(variables);
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

exports.compare_timestamps = function(timestamp_before, timestamp_after) {
	var before = moment(timestamp_before, "YYYY-MM-DD HH:mm");
	var after = moment(timestamp_after, "YYYY-MM-DD HH:mm");
	console.log(after.diff(before));
	return after.diff(before);
}

exports.fileFilterImages = function (req, file, cb) {
	if(file) {
		if (file.mimetype.indexOf('image') != -1) { // valid image file
			cb(null, true);
		} else { // invalid file
			log.error("Wrong filetype provided");
			cb(null, false);
		}
	}
}

exports.fileFilterImagesAndVideos = function (req, file, cb) {
	if(file) {
		if (file.mimetype.indexOf('image') != -1 || file.mimetype.indexOf('video') != -1) { // valid image file
			cb(null, true);
		} else { // invalid file
			log.error("Wrong filetype provided");
			cb(null, false);
		}
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



