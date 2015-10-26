/*********************************************************
 **************************USER***************************
 *********************************************************
 * Set of functions that implement CRUD operations using a 
 * postgres driver. This specific file - dao_user.js - 
 * declares methods related to the User class, which
 * is detailed below, together with the usage of the methods
 * in a RESTful application.
 * user JSON object : 
 *	{
 *		id_user : [int],
 *		name : [string], 
 *      email : [email], // kinda ensures UNIQUEness
 *		password : [alphanumeric]
 *		access_token : [alphanumeric], 
 --------------EXTERNAL TABLES-------------------
 *		voted_posts : [int array], 
 *		liked_posts : [int array], 
 *		seen_posts : [int array], // better buffer the requisitions
 *		following : [int array], 
 ------------------------------------------------
 *      avatar : [string], // optional avatar photo, or fetch from facebook
 * 		access_token : [text],
 * 		expires_at : [int],
 * 		facebook_user_id : [text],
 *      user_type : [string]
 *	}
 *
				
CREATE EXTENSION CITEXT;
CREATE TABLE instads_user (	
	id_user SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	email CITEXT  UNIQUE NOT NULL,
	password TEXT,
	avatar TEXT,
	access_token TEXT,
	expires_in BIGINT,
	facebook_user_id TEXT
	);
INSERT INTO instads_user (name, email, password) VALUES ('Gabriel Takaoka Nishimura', 'gabriel.nishimura@usp.br', 'super900') RETURNING id_user;

	
CREATE TABLE user_votes (id_user INTEGER REFERENCES instads_user(id_user),
						 id_post INTEGER REFERENCES post(id_post));
CREATE TABLE user_likes (id_user INTEGER REFERENCES instads_user(id_user),
						 id_post INTEGER REFERENCES post(id_post));
 *
 *********************************************************
 *********************************************************
 *********************************************************/

// ---- [start of imports] ----
// Main Imports - Express and App
var app 		= require('../server');
// Database related imports
var pgp 		= require('./pgp');
var db 			= pgp.db;
// Logging related imports
var common 		= require('./common');
var log 		= common.log;
// Config related imports
var cfg 		= require('./config');
// Passport related stuff
var passport	= require('passport');
// Uniqueness related imports
var uuid 		= require('node-uuid');
// File upload related imports
var fs 			= require('fs');
var multer  	= require('multer');

var upload 	= multer({
	fileFilter: function (req, file, cb) {
		if(file) {
			if (file.mimetype.indexOf('image') != -1) { // valid image file
				cb(null, true);
			} else { // invalid file
				log.error("Wrong filetype provided");
				cb(null, false);
			}
		}
	}, 
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, 'uploads/users/');
		},
		filename: function (req, file, cb) {
			if(file) {
				cb(null, uuid.v4() +"."+ file.mimetype.split('/')[1]);
			}
		}
	}),
	limits: { fileSize: cfg.DEFAULT_MAXIMUM_UPLOAD_LIMIT_USER * 1024 * 1024 }
});
// ---- [end of imports] ----

app.get('/logout', isLoggedIn, function(req, res) {
	req.logout();
	res.redirect('/');
});

// =====================================
// LOGIN ROUTES ========================
// =====================================
app.post('/login', function(req, res, next) {
	passport.authenticate('local-login', function(err, user, info) {
		if (err) { return next(err); }
		
		if (!user) { return res.status(401).json({error: "Wrong username or password."}); }
		
		req.login(user, function(err) {
			if (err) { return next(err); }
			
			return res.redirect('/api/v1/companies');
		});
	})(req, res, next);
});

// =====================================
// SIGNUP ROUTE ========================
// =====================================
app.post('/authentication', function(req, res, next) {
	passport.authenticate('local-signup', function(err, user, info) {
		if (err) { return next(err); }
		if (!user) { return res.redirect('login.html'); }
	})(req, res, next);
});

// =====================================
// FACEBOOK ROUTES =====================
// =====================================
// route for facebook authentication and login
app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
	successRedirect : '/api/v1/companies',
	failureRedirect : '/'
}));

app.get	('/oi', isLoggedIn, function(req, res, next) {
	log.info(req.user);	
	res.status(200).end("I HAVE SOME KIND OF PERMISSION! yeye");
}); 

app.put('/users', isLoggedIn, upload.single('avatar'), function(req, res){
	var q_params = [
		req.body.name,												// user name
		req.body.email, 											// user email
		(req.file !== undefined) ? req.file.mimetype : undefined, 	// file mimetype
		(req.file !== undefined) ? req.file.filename : undefined];	// filepath 
	
	verifyParams(['string', 'string', 'mimetype_optional', 'uuid_optional'], q_params, res);
	
	var q = "UPDATE instads_user user_new SET (name, email, mimetype, avatar) = "+
			"($1, $2, $3, $4, $5) FROM instads_user user_old WHERE user_new.id_user = user_old.id_user AND user_new.id_user = ($8) " + 
			"RETURNING user_old.avatar;";
	
	if (req.file === undefined) {
		q = "UPDATE instads_user SET (name, email) = ($1, $2) WHERE id_user = ($3);";
		q_params.splice(q_params.indexOf(undefined),1); // remove undefined
		q_params.splice(q_params.indexOf(undefined),1); // remove undefined
	}
	
	db.oneOrNone(q, q_params)
	.then(function(data){
		if (req.body.avatar !== undefined) // if file uploaded, delete old file
			fs.unlink('./uploads/users/'+data.avatar);
		
		res.status(200).json({success : true});
	});
});

function sendStatus500Error(res) {
	res.writeHead(500, {'content-type': 'text/plain'});
	res.end('Server internal error. ');
}

function verifyParams(types, vars, res) {
	var v = common.is_data_valid(types, vars);
	if (!v.success) { // verify errors in provided parameters
		res.status(400).end(v.error);
	}
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
	res.status(403).end({error:"Unauthorized..."});
}