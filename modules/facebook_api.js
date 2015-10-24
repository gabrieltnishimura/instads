var https = require('https');
var cfg = require("./config");
var common = require('./common');
var log = common.log;

exports.getUserToken = function(userTOK) {
	var debug_user_token = {
		host: 'graph.facebook.com',
		port: '443',
		path: '/oauth/debug_token?input_token='+userTOK+'&access_token='+cfg.fb.accessToken,
		method: 'GET'
	};		
	
	https.get(debug_user_token, function(response) {s
		var body = '';
		response.on('data', function(chunk) {
			body += chunk;
		});
		response.on('end', function() {
			return JSON.stringify(eval("(" + body + ")"));
		});
	}).on('error', function() {
		log.error("Something went wrong when request https");
		return false;
	});
}

exports.getAppToken = function(userTOK) {
	var get_apptoken = {
		host: 'graph.facebook.com',
		port: '443',
		path: '/oauth/access_token?client_id='+cfg.fb.clientID+'&client_secret='+cfg.fb.clientSecret+'&grant_type=client_credentials',
		method: 'GET'
	};
	
	https.get(get_apptoken, function(response) {s
		var body = '';
		response.on('data', function(chunk) {
			body += chunk;
		});
		response.on('end', function() {
			return JSON.stringify(eval("(" + body + ")"));
		});
	}).on('error', function() {
		log.error("Something went wrong when request https");
		return false;
	});
}