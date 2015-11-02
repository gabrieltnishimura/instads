// Main Imports - Express and App
var app 		= require('../server');
// Common modules
var common 		= require('../common');
var cfg			= common.config;
var db			= common.db;
var path		= common.path;
var log			= common.log;
var passport	= common.passport;

app.get	('/check_permissions', isLoggedIn, function(req, res, next) {
	res.status(200).json(req.user);
}); 

app.get	('/hot', function(req, res, next) {
	res.sendFile(path.resolve('./view/hot.html'));
}); 

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	// Cheater MacCheaterson
	var token = cfg.app_secret;
	if ((req.body.access_token !== undefined && req.body.access_token == token) ||
		(req.query.access_token !== undefined && req.query.access_token == token)) {
		log.info("[Auth with token]");
		db.one("SELECT id_user, email FROM instads_user LIMIT 1", [])
		.then(function(data){
			req.user = {id : data.id_user};
			//req.login({id : data.id_user, email : data.email}, function(err) {});
			return next();
		}, function(reason){
			res.status(403).json({error:reason});
		});
	} else {
		// if user is authenticated in the session, carry on 
		if (req.isAuthenticated()) {
			
			return next();
		}
		// if they aren't redirect them to the home page
		res.status(403).json({error:"Unauthorized..."});
	}
}