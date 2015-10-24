var moment = require('moment');
moment().format();
var bunyan = require('bunyan');
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
		{
			level: 'error',
			path: 'instads_error.log'  // log ERROR and above to a file
		},
		{
			leve: 'info',
			path: 'instads_info.log'
		}
	]
});
exports.log = log;
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
	return after.diff(before);
}
isValidUUID = function (uuid) {
	var uuid_regex = new RegExp("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}");
	if (uuid_regex.test(uuid.split('.')[0])){
		return true;
	}
	return false;
}

function isNormalInteger(str) {
    var n = ~~Number(str);
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



