/*********************************************************
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
 *		content_type : [alphanumeric], 
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
					content_type TEXT, 
					time_posted TIMESTAMP WITH TIME ZONE,
					file_path TEXT NOT NULL,
					id_competition INTEGER NOT NULL references competition(id_competition));

INSERT INTO post (file_path, title, content_type, description, votes, id_creator) VALUES ('file_path', 'compename', 'video', 'desc', 12, 32);

SELECT * FROM post
 *
 * LEAVE PROMISES FOR LATER
 ***********************************************************/

var express = require("express");
var app = module.exports = express(); // we export new express app here!
var pg = require("pg");
var common = require('./common');
var log = common.log;
var connectionString = "postgres://postgres:dom1nion!@127.0.0.1:5432/instads";
var client = new pg.Client(connectionString);
var uuid = require('node-uuid');
var multer  = require('multer');
var upload = multer({
	fileFilter: function (req, file, cb) {
		if (file) {
			if (file.mimetype.indexOf('image') != -1 || 
				file.mimetype.indexOf('video') != -1) {
				cb(null, true); // To accept the file pass `true`, like so
			} else {
				log.error("Wrong filetype provided");
				cb(null, false); // To reject this file pass `false`, like so:
			}
		}
	}, 
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, 'uploads/');
		},
		filename: function (req, file, cb) {
			if (file) {
				cb(null, uuid.v4() +"."+ file.mimetype.split('/')[1]);
			}
		}
	}),
	limits: { fileSize: cfg.DEFAULT_MAXIMUM_UPLOAD_LIMIT_POST * 1024 * 1024 }
});

function handleError(err, done, client, res) {
	if(!err) return false; // no error occurred, continue with the request
	log.info(err);
	if(client) { // error occurred, remove from pool and send error message
		done(client); 
	}
	res.writeHead(500, {'content-type': 'text/plain'});
	res.end('Server internal error 1');
	return true;
}

/** Demo upload page! */
app.get('/send_upload', function (req, res) {
	// show a file upload form
	res.end('<html><body><form action="/posts" enctype="multipart/form-data" method="POST">'+
		'<input type="text" placeholder="Titulo do Post" name="title" /><br>'+
		'<textarea placeholder="Descricao do Post" name="description" cols="50" rows="10"></textarea><br>'+
		'<select name="content_type"><option value="video">Video</option><option value="photo">Photo</option></select><br>'+
		'<input type="hidden" name="id_competition" value="1"/><br>'+
		'<input type="file" name="post_file" /><br>'+
		'<input type="submit" value="Upload" />'+
		'</form></body></html>');
});

/** POST ROUTE **/
app.post('/posts', upload.single('post_file'), function(req, res){
//    log.info(req.body); // form fields
//	  log.info(req.file); // form files
	var search_parameters = [
		(req.file !== undefined) ? req.file.filename : undefined, // filename in uuid format
		req.body.title, 										  // post title
		req.body.description, 									  // post description
		(req.file !== undefined) ? req.file.mimetype : undefined, // file type in mimetype
		0, 														  // number of votes
		0];														  // id_creator @todo
	var v = common.is_data_valid(['uuid', 'string', 'string', 'video_or_photo', 'int', 'int'], search_parameters);
	if (!v.success) { // verify errors in provided parameters
		res.status(400).end(v.error);
		return;
	}
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection

		var query = "INSERT INTO post (file_path, title, description, content_type, votes, time_posted, id_creator) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6) RETURNING id_post";
		
		//console.log(query); console.log(search_parameters);	
		client.query(query, search_parameters, function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			log.info("Created post!");
			res.set({'ETag': result.rows[0].id_post}); // this is awesome!
			res.status(201).end();
		});
	});
});

/** GET ROUTE **/
app.get('/posts', function (req, res) {
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection

		// if there's no error then query db
		var query = "SELECT title, description, id_creator, content_type, file_path, votes, time_posted FROM post";
		var search_parameters = new Array();
		
		// Get parameters from URL @todo verify parameters
		title = req.query.title;
		id_creator = req.query.id_creator === undefined ? undefined : parseInt(req.query.id_creator);
		content_type = req.query.content_type;
		order = req.query.order;
		limit = req.query.limit;
		
		if (title !== undefined || id_creator !== undefined || content_type !== undefined || order !== undefined) {
			query += " WHERE"
			if (title !== undefined) {
				search_parameters.push("%" + title + "%");
				query += " title LIKE ($" + search_parameters.length + ") ";
			} if (id_creator !== undefined) {
				search_parameters.push(id_creator);
				query += title !== undefined ? " AND" : "";
				query += " id_creator = ($" + search_parameters.length + ") ";
			} if (content_type !== undefined) {
				search_parameters.push(content_type);
				query += (title !== undefined || id_creator !== undefined) ? " AND" : "";
				query += " content_type = ($" + search_parameters.length + ") ";
			} if (order !== undefined && (order == "ASC" || order == "DESC")) {
				search_parameters.push(order);
				query += (title !== undefined || id_creator !== undefined || content_type !== undefined) ? " AND" : "";
				query += " order ($" + search_parameters.length + ") ";
			}
		}
		if (limit !== undefined) {
			search_parameters.push(limit);
			query += " LIMIT ($" + search_parameters.length + ") ";
		}
		//console.log(query); console.log(search_parameters);	
		client.query(query, search_parameters, function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			res.json(result.rows); // return status code 200, application/json and query content
		});
	});
});

app.get('/posts/:id_post', function (req, res) {
	if (!req.params.id_post) { // validate parameters
		res.status(400);
		res.end("[BAD REQUEST] Invalid parameters provided.");
		return;
	}
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection

		// if there's no error then query db
		var query = "SELECT title, description, id_creator, content_type, file_path, time_posted FROM post WHERE id_post = ($1)";
		client.query(query, [req.params.id_post], function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			if (result.rows.length == 0) {
				res.status(404);
				res.end("Resource not found");
			} else {
				res.json(result.rows); // return status code 200, application/json and query content
			}
		});
	});
});

// accept DELETE request at /user
app.delete('/posts/:id_post', function (req, res) {
	if (!req.params.id_post) { // validate parameters
		res.status(400);
		res.end("[BAD REQUEST] Invalid parameters provided.");
		return;
	}
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection
		// if there's no error then query db
		var query = "DELETE FROM post WHERE id_post = ($1)";
		
		client.query(query, [req.params.id_post], function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			res.json({success: true}); // return status code 200, application/json and query content
			res.end();
		});
	});
});

/* PUT ROUTE */
app.put('/posts', upload.single('post_file'), function(req, res){
//    log.info(req.body); // form fields
//	  log.info(req.file); // form files
	var search_parameters = [
		(req.file !== undefined) ? req.file.filename : undefined, // filename in uuid format
		req.body.title, 										  // post title
		req.body.description, 									  // post description
		(req.file !== undefined) ? req.file.mimetype : undefined, // file type in mimetype
		0, 														  // number of votes
		0];														  // id_creator @todo
	var v = common.is_data_valid(['uuid', 'string', 'string', 'video_or_photo', 'int', 'int'], search_parameters);
	if (!v.success) { // verify errors in provided parameters
		res.status(400).end(v.error);
		return;
	}
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection

		var query = "UPDATE INTO post (file_path, title, description, content_type, votes, time_posted, id_creator) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6) RETURNING id_post";
		
		//console.log(query); console.log(search_parameters);	
		client.query(query, search_parameters, function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			log.info("Created post!");
			res.set({'ETag': result.rows[0].id_post}); // this is awesome!
			res.status(201).end();
		});
	});
});