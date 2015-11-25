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
var app 		= require('../../server');
// Common modules
var common 		= require('../../common');
// Config related imports
var cfg 		= common.config;
// Logging related imports
var log			= common.log;
// Database related imports
var db 			= common.db;
// File upload related imports
var fs 			= common.fs;
// ---- [end of imports] ----

// Creating upload middleware for User Routes
var upload 		= common.getMulterObject(
	cfg.DEFAULT_UPLOAD_DIR_USER,
	cfg.DEFAULT_MAXIMUM_UPLOAD_LIMIT_USER,
	['image']);

app.put('/users', upload.single('avatar'), function(req, res){
	var q_params = [
		req.body.name,												// user name
		req.body.email, 											// user email
		(req.file !== undefined) ? req.file.mimetype : undefined, 	// file mimetype
		(req.file !== undefined) ? req.file.filename : undefined];	// filepath 
	
	var v = common.is_data_valid(['string', 'string', 'mimetype_optional', 'uuid_optional'], q_params, vars);
	if (!v.success) { // verify errors in provided parameters
		res.status(400).end(v.error); return;
	}
	
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