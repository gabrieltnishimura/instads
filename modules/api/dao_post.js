/*********************************************************
 ***************************POST**************************
 *********************************************************
 * Set of functions that implement CRUD operations using a 
 * postgres driver. This specific file - dao_post.js - 
 * declares methods related to the Post class, which
 * is detailed below, together with the usage of the methods
 * in a RESTful application.
 * post JSON object : 
 *	{
 *		id_post : [int],
 *		title : [string], 
 *		description : [string]
 *		votes : [int], 
 *		id_creator : [int],
 *		mimetype : [string], 
 *		file_path : [string],
 * 		id_competition : [int]
 *	}
 *
 *
 
CREATE TABLE post (	id_post SERIAL PRIMARY KEY,
					title TEXT NOT NULL,
					description TEXT NOT NULL,
					votes INTEGER DEFAULT 0 NOT NULL,
					id_creator INTEGER NOT NULL references instads_user(id_user), 
					mimetype TEXT, 
					time_posted TIMESTAMP WITH TIME ZONE,
					file_path TEXT NOT NULL,
					id_competition INTEGER NOT NULL references competition(id_competition));

INSERT INTO post (file_path, title, mimetype, description, votes, id_creator) VALUES ('file_path', 'compename', 'video', 'desc', 12, 32);

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
// Uniqueness related imports
var uuid 		= common.uuid;
// File upload related imports
var fs 			= common.fs;
var multer  	= common.multer;
// ---- [end of imports] ----

// Creating upload middleware for Post Routes
var upload 		= common.getMulterObject(
	cfg.DEFAULT_UPLOAD_DIR_POST,
	cfg.DEFAULT_MAXIMUM_UPLOAD_LIMIT_POST,
	['image', 'video']);

/** POST ROUTE -- MUST PROVIDE ALL PARAMETERS IN ORDER TO WORK **/
app.post('/posts', upload.single('post_file'), function(req, res) {
	common.isLoggedIn(req, res, function() {
		var q_params = [
			req.body.title, 										  // post title
			req.body.description, 									  // post description
			(req.file !== undefined) ? req.file.filename : undefined, // filename in uuid format
			(req.file !== undefined) ? req.file.mimetype : undefined, // file type in mimetype
			req.body.id_competition,								  // id_competition
			req.user.id];											  // id_creator

		var v = common.is_data_valid(['string', 'string', 'uuid', 'mimetype', 'int', 'int'], q_params);
		if (!v.success) { // verify errors in provided parameters
			if (req.file !== undefined) { // file must be deleted if parameters are wrong
				fs.unlink(cfg.DEFAULT_UPLOAD_DIR_POST+req.file.filename, function(err) {
					res.status(err?500:400).end(v.error);
				});
			} else {
				res.status(400).end(v.error);
			}
		} else {
			// query posgres for one result
			db.one(	"INSERT INTO post (title, description, file_path, mimetype, time_posted, id_competition, id_creator) "+
					"VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6) RETURNING id_post", q_params)
			.then(function(data){
				log.info("Created post with id: " + data.id_post);
				res.set({'ETag': data.id_post});
				res.status(201).end();
			}, function(reason){
				log.error(reason);
				res.status(500).end('Server internal error. ');
			});
		}
	}); // isLoggedIn
});

/** VOTATION ROUTE -- MUST PROVIDE ALL PARAMETERS IN ORDER TO WORK **/
app.post('/votes/:id_post', common.isLoggedIn, function(req, res) {
	if (req.params.id_post !== undefined && !isNaN(req.params.id_post)) {
		if (req.query.op !== undefined && req.query.op == "increment")  {
			db.none("SELECT * FROM user_votes WHERE id_user = ($1) AND id_post = ($2)", [req.user.id, req.params.id_post])
			.then(function(data){ // there first time of vote
				db.one("UPDATE post SET votes = votes + 1 WHERE id_post = $1 RETURNING votes", [req.params.id_post])
				.then(function(data){
					db.one("INSERT INTO user_votes (id_user, id_post) VALUES ($1, $2)", [req.user.id, req.params.id_post])
					.then(function(data){
						res.json({votes:data.votes});
					});	
				}, function(reason){
					res.status(404).end("Post was not found");
				});	
			}, function(reason) { // already voted
				res.status(400).end("User alredy voted in this post");
			});
		} else if (req.query.op !== undefined && req.query.op == "decrement")  {
			db.one("SELECT * FROM user_votes WHERE id_user = ($1) AND id_post = ($2)", [req.user.id, req.params.id_post])
			.then(function(data) { // has to find vote
				db.one("UPDATE post SET votes = votes - 1 WHERE id_post = $1 RETURNING votes", [req.params.id_post])
				.then(function(data){
					db.one("DELETE FROM user_votes WHERE id_user = ($1) AND id_post = ($2);", [req.user.id, req.params.id_post])
					.then(function(data){
						res.json({votes:data.votes});
					});	
				}, function(reason){
					res.status(404).end("Post was not found");
				});	
			}, function(reason) { // never voted before
				res.status(400).end("User never voted in this post");
			});
		}
	}
});

// accept GET request at /api/v1/posts
app.get('/posts', function (req, res) {
	var q = "SELECT p.id_post, p.title, p.description, p.id_creator, p.id_competition, p.file_path, p.mimetype, " +
			" u.name FROM post p, instads_user u WHERE u.id_user = p.id_creator ";
	var q_params = [];
	
	// Get parameters from URL
	title = req.query.title;
	id_creator = req.query.id_creator === undefined ? undefined : parseInt(req.query.id_creator);
	id_competition = req.query.id_competition === undefined ? undefined : parseInt(req.query.id_competition);
	mimetype = req.query.mimetype;
	order = req.query.order;
	limit = req.query.limit;
	offset = req.query.offset;
	
	if (title !== undefined || id_creator !== undefined || id_competition !== undefined || mimetype !== undefined) {
		q += " AND "
		// [optional] title
		if (title !== undefined) {
			q_params.push("%" + title + "%");
			q += " p.title ILIKE ($" + q_params.length + ") ";
		}
		// [optional] id_creator
		if (id_creator !== undefined) {
			if (isNaN(id_creator)) {
				res.status(400).end("Creator provided is not a integer number. Please refer to documentation or provide a integer."); return;
			} else {
				q_params.push(id_creator);
				q += title !== undefined ? " AND" : "";
				q += " p.id_creator = ($" + q_params.length + ") ";
			}
		}
		// [optional] id_competition
		if (id_competition !== undefined) {
			if (isNaN(id_competition)) {
				res.status(400).end("Creator provided is not a integer number. Please refer to documentation or provide a integer."); return;
			} else {
				q_params.push(id_competition);
				q += (title !== undefined || id_creator !== undefined) ? " AND" : "";
				q += " p.id_competition = ($" + q_params.length + ") ";
			}
		}
		// [optional] mimetype
		if (mimetype !== undefined) {
			q_params.push(mimetype);
			query += (title !== undefined || id_creator !== undefined || id_competition !== undefined) ? " AND" : "";
			query += " p.mimetype ILIKE ($" + q_params.length + ") ";
		}
	}
	
	// ORDER BY 
	if (order !== undefined) {
		if (order == "ASC" || order == "DESC") {
			q_params.push(order);
			q += " ORDER BY p.title $" + q_params.length + " ";
		} else {
			res.status(400).end("Order provided is not ASC neither DESC. Please refer to documentation or provide right parameters"); return;
		}
	}
	
	// Limit has to be a number
	if (limit !== undefined && isNaN(limit)) {
		res.status(400).end("Limit provided is not a integer number. Please refer to documentation or provide a integer."); return;
	}

	// Offset has to be a number
	if (offset !== undefined && isNaN(offset)) {
		res.status(400).end("Offset provided is not a integer number. Please refer to documentation or provide a integer."); return;
	}

	// DEFAULT LIMIT defined at config.js
	q_params.push(limit < cfg.DEFAULT_QUERY_LIMIT_POST ? limit : cfg.DEFAULT_QUERY_LIMIT_POST);
	q += " LIMIT ($" + q_params.length + ") ";
	
	// DEFAULT OFFSET is zero
	q_params.push(offset > 0 ? offset : 0);
	q += " OFFSET ($" + q_params.length + ") ";
	
	// Log Query and Parameters
	log.info(q); log.info(q_params);
	
	// Query posgtres for many results
	db.any(q, q_params)
	.then(function(data){
		res.json(data);
	}, function(reason){
		log.error(reason);
		res.status(500).end('Server internal error. ');
	});
});

// accept GET request at /api/v1/posts/:id_post
app.get('/posts/:id_post', function (req, res) {
	// Validade parameters from URL
	var id_post = req.params.id_post;
	var q = "SELECT title, description, id_creator, mimetype, file_path, time_posted, votes FROM post WHERE id_post = ($1)";
	
	if (id_post === undefined || isNaN(id_post)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided."); return;
	} else {
		db.one(q, [id_post])
		.then(function(data){
			res.json(data);
		}, function(reason){
			if (reason.indexOf('No data returned') != -1) {
				res.status(404).end("Resource not found"); return;
			}
			log.error(reason);
			res.status(500).end('Server internal error. ');
		});
	}
});

// accept DELETE request at /api/v1/posts/:id_post
app.delete('/posts/:id_post', common.isLoggedIn, function (req, res) {
	// Validade parameters from URL
	var id_post = req.params.id_post;
	if (id_post === undefined || isNaN(id_post)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided."); return;
	} else {
		db.one("DELETE FROM post WHERE id_post = ($1) RETURNING file_path", [id_post])
		.then(function(data){ // also delete data from user_votes
			//delete uploaded image
			fs.unlink(cfg.DEFAULT_UPLOAD_DIR_POST+data.file_path, function (err) {
				if (err)
					res.status(500).end('Error deleting file');
				else {
					db.none("DELETE FROM user_votes WHERE id_post = ($1)", [id_post])
					.then(function(data){
						res.status(204).json({success : true});
					}, function(reason) {
						log.info(reason);
						res.status(500).end('Server internal error. ');
					});
				}
			});
		}, function(reason){
			log.error(reason);
			res.status(500).end('Server internal error. ');
		});
	}
});

// accept PUT request at /api/v1/posts/:id_post
app.put('/posts/:id_post', upload.single('post_file'), function (req, res) {
	common.isLoggedIn(req, res, function() {
		// Validade parameters from request/url
		var q_params = [
			req.body.title, 										 	// post title
			req.body.description, 										// post description
			(req.file !== undefined) ? req.file.filename : undefined, 	// filename in uuid format
			(req.file !== undefined) ? req.file.mimetype : undefined, 	// file type in mimetype
			req.user.id,												// id_creator @todo
			req.params.id_post];										// id_post			  

		var v = common.is_data_valid(['string', 'string', 'uuid_optional', 'mimetype_optional', 'int', 'int'], q_params);
		if (!v.success) { // verify errors in provided parameters
			if (req.file !== undefined) { // file must be deleted if parameters are wrong
				fs.unlink(cfg.DEFAULT_UPLOAD_DIR_POST+req.file.filename, function(err) {
						res.status(err?500:400).end(v.error);
				});
			} else {
				res.status(400).end(v.error);
			}
		} else {
			var q = "UPDATE post post_new SET (title, description, file_path, mimetype, id_creator) = "+
					"($1, $2, $3, $4, $5) FROM post post_old WHERE post_new.id_post = post_old.id_post AND post_new.id_post = ($6) " + 
					"RETURNING post_old.file_path";
			
			if (req.file === undefined) {
				q = "UPDATE post post_new SET (title, description, id_creator) = "+
					"($1, $2, $3)WHERE id_post = ($4);";
				q_params.splice(q_params.indexOf(undefined),1); // remove undefined
				q_params.splice(q_params.indexOf(undefined),1); // remove undefined
			}
			
			db.oneOrNone(q, q_params) // query oneOrNone
			.then(function(data){
				if (req.file !== undefined) { // there is a new file
					fs.unlink(cfg.DEFAULT_UPLOAD_DIR_POST+data.file_path, function (err) {
						res.status(err?500:200).json(err?{success:false}:{success:true});
					});
				} else {
					res.status(200).json({success : true});
				}
			}, function(reason) {
				log.info(reason);
				res.status(500).end('Server internal error. ');
			});
		}
	});
});