// Main Imports - Express and App
var app 		= require('../server');
// Common modules
var common 		= require('../common');
var cfg			= common.config;
var db			= common.db;
var path		= common.path;

app.get	('/oi', isLoggedIn, function(req, res, next) {
	log.info(req.user);	
	res.status(200).end("I HAVE SOME KIND OF PERMISSION! yeye");
}); 

app.get	('/hot', function(req, res, next) {
	res.sendFile(path.resolve('./view/hot.html'));
}); 

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	// Cheater MacCheaterson
	var token = cfg.app_secret;
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
		res.status(403).end({error:"Unauthorized..."});
	}
}