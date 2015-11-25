/*********************************************************
 *********************Authentication**********************
 *********************************************************
 * Set of functions that manages authentication routes!
 *********************************************************
 *********************************************************
 *********************************************************/

// ---- [start of imports] ----
// Main Imports - Express and App
var app 		= require('../../server');
// Common modules
var common 		= require('../../common');
// Logging related imports
var log			= common.log;
// Passport related stuff
var passport	= common.passport;
// Json Web Tokens!
var jwt 		= common.jwt;
// ---- [end of imports] ----

// =====================================
// LOGIN ROUTES ========================
// =====================================
app.post('/login', function(req, res, next) {
	passport.authenticate('local-login', function(err, user, info) {
		if (err) { return next(err); }
		if (!user) { return res.status(401).json({error: "Wrong username or password.1"}); }
		
		req.login(user, function(err) {
			if (err) { return next(err); }
			return res.json({success : true, user : req.user});
		});
	})(req, res, next);
});

// =====================================
// SIGNUP ROUTE ========================
// =====================================
app.post('/authentication', function(req, res, next) {
	passport.authenticate('local-signup', function(err, user, info) {
		if (err) { return next(err); }
		if (!user) { return res.json({sucess : false, user : null}) }
	})(req, res, next);
});

// =====================================
// FACEBOOK ROUTE ========================
// =====================================
app.post('/auth/facebook', function(req, res, next) {
	db.one("SELECT * FROM instads_user WHERE facebook_user_id = ($1)", [profile.id])
	.then(function(data){
		console.log("Signin of user with id: " + data[0].id_user);
		done(null, {id: data[0].id_user, email : data[0].email});
	}, function(reason) { // error
		db.one("INSERT INTO instads_user (name, email, access_token, facebook_user_id)"+
			" VALUES ($1, $2, $3, $4) RETURNING id_user", [profile.name.givenName + ' ' + profile.name.familyName, profile.emails[0].value, token, profile.id])
		.then(function(data){
			console.log("Signup of user with id: " + data.id_user);
			return done(null, {id: data.id_user, email : profile.emails[0].value});
		}, function(reason){
			return done(null, false);
		});
	});
});

// =====================================
// CONSOLIDATING ROUTES ================
// =====================================
app.get('/auth', function(req, res, next) {
	jwt.sign({ scopes: ['a', 'b', 'c'] }, common.config.app_secret, { expiresIn: '7d', issuer: 'me', subject: 'user' }, function(token) {
		res.cookie('jwt', token, { maxAge: 7*24*60*60*1000, httpOnly: true }); // @todo security
		res.send("Authenticated!!");
	});

	/*var type = req.body.type;
	switch(type) {
		case 'facebook':
			db.one("SELECT * FROM instads_user WHERE facebook_user_id = ($1)", [req.body.id])
			.then(function(data) {
				console.log("Signin of user with id: " + data[0].id_user);
				done(null, {id: data[0].id_user, email : data[0].email});
			}, function(reason) { // error
				db.one("INSERT INTO instads_user (name, email, access_token, facebook_user_id)"+
					" VALUES ($1, $2, $3, $4) RETURNING id_user", [profile.name.givenName + ' ' + profile.name.familyName, profile.emails[0].value, token, profile.id])
				.then(function(data){
					console.log("Signup of user with id: " + data.id_user);
					return done(null, {id: data.id_user, email : profile.emails[0].value});
				}, function(reason){
					return done(null, false);
				});
			});
		break;
		case 'basic':
		
		break;
		case 'google': 
		
		break;
		default: 
			res.status(403).send("Provide a valid authentication type."); return;
		break;
	}*/
	
	/*jwt.sign({ scopes: ['a', 'b', 'c'] }, common.config.app_secret, { expiresIn: '7d', issuer: 'me', subject: 'user' }, function(token) {
		res.cookie('jwt', token, { maxAge: 900000, httpOnly: true }); // @todo security
		res.send("Hello!");
	});*/
});
app.get('/auth2', common.isLoggedIn, function(req, res, next) {
	res.end("success!");
});
// =====================================
// LOGOUT ROUTES =======================
// =====================================
app.get('/logout', common.isLoggedIn, function(req, res) {
	req.logout();
	res.json({success : true});
});

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}
