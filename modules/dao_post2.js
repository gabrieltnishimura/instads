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
var express = require("express");
var app = module.exports = express(); // we export new express app here!

// Database related imports
var pgp = require('pg-promise')(/*options*/);
var db = pgp("postgres://postgres:dom1nion!@127.0.0.1:5432/instads");

// Logging related imports
var common = require('./common');
var log = common.log;

// Config related imports
var cfg = require('./config');

// Uniqueness related imports
var uuid = require('node-uuid');

// File upload related imports
var fs = require('fs');
var multer  = require('multer');
var upload = multer({
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
			cb(null, 'uploads/posts/');
		},
		filename: function (req, file, cb) {
			if(file) {
				cb(null, uuid.v4() +"."+ file.mimetype.split('/')[1]);
			}
		}
	}),
	limits: { fileSize: cfg.DEFAULT_MAXIMUM_UPLOAD_LIMIT_POST * 1024 * 1024 }
});
// ---- [end of imports] ----

/** Demo upload page! */
app.get('/send_upload', function (req, res) {
	// show a file upload form
	res.end('<html><body><form action="/posts" enctype="multipart/form-data" method="POST">'+
		'<input type="text" placeholder="Titulo do Post" name="title" /><br>'+
		'<textarea placeholder="Descricao do Post" name="description" cols="50" rows="10"></textarea><br>'+
		'<select name="mimetype"><option value="video">Video</option><option value="photo">Photo</option></select><br>'+
		'<input type="hidden" name="id_competition" value="1"/><br>'+
		'<input type="file" name="post_file" /><br>'+
		'<input type="submit" value="Upload" />'+
		'</form></body></html>');
});

/** POST ROUTE -- MUST PROVIDE ALL PARAMETERS IN ORDER TO WORK **/
app.post('/api/v1/posts', upload.single('post_file'), function(req, res) {
	var q_params = [
		req.body.title, 										  // post title
		req.body.description, 									  // post description
		(req.file !== undefined) ? req.file.filename : undefined, // filename in uuid format
		(req.file !== undefined) ? req.file.mimetype : undefined, // file type in mimetype
		0];														  // id_creator @todo

	verifyParams(['string', 'string', 'uuid', 'mimetype', 'int'], q_params, res);

	// query posgres for one result
	db.one(	"INSERT INTO post (file_path, title, description, mimetype, votes, time_posted, id_creator) "+
			"VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, $5) RETURNING id_post", q_params)
		.then(function(data){
			log.info("Created post with id: " + data.id_post);
			res.set({'ETag': data.id_post});
			res.status(201).end();
		}, function(reason){
			log.error(reason);
			sendStatus500Error(res);
		});	
});

// accept GET request at /api/v1/posts
app.get('/api/v1/posts', function (req, res) {
	var q = "SELECT * FROM post";
	var q_params = new Array();
	
	// Get parameters from URL
	title = req.query.title;
	id_creator = req.query.id_creator === undefined ? undefined : parseInt(req.query.id_creator);
	mimetype = req.query.mimetype;
	order = req.query.order;
	limit = req.query.limit;
	offset = req.query.offset;
	
	if (title !== undefined || id_creator !== undefined || mimetype !== undefined) {
		q += " WHERE "
		// [optional] title
		if (title !== undefined) {
			q_params.push("%" + title + "%");
			q += " title ILIKE ($" + q_params.length + ") ";
		}
		// [optional] id_creator
		if (id_creator !== undefined) {
			if (isNaN(id_creator)) {
				res.status(400).end("Creator provided is not a integer number. Please refer to documentation or provide a integer.");
			} else {
				q_params.push(id_creator);
				q += title !== undefined ? " AND" : "";
				q += " id_creator = ($" + q_params.length + ") ";
			}
		}
		// [optional] mimetype
		if (mimetype !== undefined) {
			q_params.push(mimetype);
			query += (title !== undefined || id_creator !== undefined) ? " AND" : "";
			query += " mimetype = ($" + q_params.length + ") ";
		}
	}
	
	// ORDER BY 
	if (order !== undefined) {
		if (order == "ASC" || order == "DESC") {
			q_params.push(order);
			q += " ORDER ($" + q_params.length + ") ";
		} else {
			res.status(400).end("Order provided is not ASC neither DESC. Please refer to documentation or provide right parameters");
		}
	}
	
	// Limit has to be a number
	if (limit !== undefined && isNaN(limit))
		res.status(400).end("Limit provided is not a integer number. Please refer to documentation or provide a integer.");

	// Offset has to be a number
	if (offset !== undefined && isNaN(offset))
		res.status(400).end("Offset provided is not a integer number. Please refer to documentation or provide a integer.");

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
			sendStatus500Error(res);
		});
});

// accept GET request at /api/v1/posts/:id_post
app.get('/api/v1/posts/:id_post', function (req, res) {
	// Validade parameters from URL
	var id_post = req.params.id_post;
	var q = "SELECT title, description, id_creator, mimetype, file_path, time_posted FROM post WHERE id_post = ($1)";
	
	if (id_post === undefined || isNaN(id_post)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided.");
	}
	
	db.one(q, [id_post])
		.then(function(data){
			res.json(data);
		}, function(reason){
			if (reason.indexOf('No data returned') != -1) {
				res.status(404).end("Resource not found");
			} else {
				log.error(reason);
				sendStatus500Error(res);
			}
		});
});

// accept DELETE request at /api/v1/posts/:id_post
app.delete('/api/v1/posts/:id_post', function (req, res) {
	// Validade parameters from URL
	var id_post = req.params.id_post;
	var q = "DELETE FROM post WHERE id_post = ($1);";

	if (id_post === undefined || isNaN(id_post)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided.");
	}
	
	db.none(q, [id_post])
		.then(function(data){
			res.status(204).json({success : true});
		}, function(reason){
			if (reason.indexOf('No data returned from the query.') != -1) {
				res.status(404).end("Resource not found");
			}
			log.error(reason);
			sendStatus500Error(res);
		});
});

// accept PUT request at /api/v1/posts/:id_post
app.put('/api/v1/posts/:id_post', upload.single('post_file'), function (req, res) {
	// Validade parameters from request/url
	var q_params = [
		req.body.title, 										  // post title
		req.body.description, 									  // post description
		(req.file !== undefined) ? req.file.filename : undefined, // filename in uuid format
		(req.file !== undefined) ? req.file.mimetype : undefined, // file type in mimetype
		req.body.votes, 										  // votes
		0];														  // id_creator @todo

	verifyParams(['string', 'string', 'uuid_optional', 'mimetype_optional', 'int', 'int'], q_params, res);
	
	var q = "UPDATE post post_new SET (title, description, file_path, mimetype, votes, times_posted, id_creator) = "+
			"($1, $2, $3, $4, $5, $6, $7) FROM post post_old WHERE post_new.id_post = post_old.id_post AND post_new.id_post = ($8) " + 
			"RETURNING post_old.file_path";
	
	if (req.file === undefined) {
		q = "UPDATE post post_new SET (title, description, votes, times_posted, id_creator) = "+
			"($1, $2, $3, $4, $5)WHERE id_post = ($6);";
		q_params.splice(q_params.indexOf(undefined),1); // remove undefined
		q_params.splice(q_params.indexOf(undefined),1); // remove undefined
	}
	
	db.oneOrNone(q, q_params) // query oneOrNone
	.then(function(data){
		if (req.file_path !== undefined) // if file uploaded, delete old file
			fs.unlink('./uploads/posts/'+data.file_path);
		
		log.info("Updated posts! ");
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