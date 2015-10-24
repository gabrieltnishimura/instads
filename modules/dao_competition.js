/*********************************************************
 ***********************COMPETITION***********************
 *********************************************************
 * Set of functions that implement CRUD operations using a 
 * postgres driver. This specific file - dao_company.js - 
 * declares methods related to the Competition class, which
 * is detailed below, together with the usage of the methods
 * in a RESTful application.
 * competition JSON object : 
	{
		id_competition : [int], 
		title : [string], 
		id_company : [int]
		description : [string], 
		starts : [date],
		ends : [date], 
		posted : [date],
		image : [string]
	}
 *
 
CREATE TABLE competition (	id_competition SERIAL PRIMARY KEY,
							title TEXT NOT NULL,
							id_company INTEGER NOT NULL REFERENCES company(id_company),
							starts TIMESTAMP WITH TIME ZONE,
							ends TIMESTAMP WITH TIME ZONE,
							posted TIMESTAMP WITH TIME ZONE,
							description TEXT NOT NULL,
							image TEXT NOT NULL )
 *
 *********************************************************
 *********************************************************
 *********************************************************/

var express = require("express");
var app = module.exports = express(); // we export new express app here!
var pg = require("pg");
var common = require('./common');
var log = common.log;
var connectionString = "postgres://postgres:dom1nion!@127.0.0.1:5432/instads";
var client = new pg.Client(connectionString);
var uuid = require('node-uuid');
var multer  = require('multer');
var auth = require('basic-auth');
var path = require('path');
var upload = multer({
	fileFilter: function (req, file, cb) {
		if (file.mimetype.indexOf('image') != -1 || // valid image file
			file.mimetype.indexOf('video') != -1) { // valid video file
			cb(null, true);
		} else { // invalid file
			log.error("Wrong filetype provided");
			cb(null, false);
		}
	}, 
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, 'uploads/company/');
		},
		filename: function (req, file, cb) {
			cb(null, uuid.v4() +"."+ file.mimetype.split('/')[1]);
		}
	}),
	limits: { fileSize: 50 * 1024 * 1024 }
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
app.get('/post_competition', function (req, res) {
	res.sendFile(path.resolve('./view/post_competition.html'));
});

/*						title TEXT NOT NULL,
							id_company INTEGER NOT NULL REFERENCES company(id_company),
							starts TIMESTAMP WITH TIME ZONE,
							ends TIMESTAMP WITH TIME ZONE,
							posted TIMESTAMP WITH TIME ZONE,
							description TEXT NOT NULL,
							image TEXT NOT NULL )*/
/** POST ROUTE -- MUST PROVIDE ALL PARAMETERS IN ORDER TO WORK **/
app.post('/competition', upload.single('image'), function(req, res){
	var search_parameters = [
		req.body.title,												// competition title	
		req.body.description,										// competition description
		req.body.starts, 											// competition start timestamp
		req.body.ends, 												// competition end timestamp
		1, 															// @todo id_company
		(req.file !== undefined) ? req.file.filename : undefined];	// filename in uuid format
	var v = common.is_data_valid(['string', 'string', 'timestamp', 'timestamp', 'int', 'uuid'], search_parameters);
	if (!v.success) { // verify errors in provided parameters
		res.status(400).end(v.error);
		return;
	}
	if (common.compare_timestamps(req.body.starts, req.body.ends) < 0) {
		res.status(400).end({success:false, error:"Before vs After = negative interval"});
		return;
	}
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection

		var query = "INSERT INTO competition (title, description, starts, ends, posted, id_company, image) VALUES "+
											"($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6) RETURNING id_competition";
		
		//console.log(query); console.log(search_parameters);	
		client.query(query, search_parameters, function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			log.info("Created competition with id: " + result.rows[0].id_company);
			res.set({'ETag': result.rows[0].id_company});
			res.status(201).end();
		});
	});	
});

/** LIMIT WITHOUT NEED OF PARAMETERS **/
app.get('/competition', function (req, res) {
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection

		// if there's no error then query db
		var query = "SELECT * FROM competition";
		var search_parameters = new Array();
		
		// Get parameters from URL @todo verify parameters
		title = req.query.title;
		description = req.query.description;
		id_company = req.query.id_company;
		limit = req.query.limit;
		
		if (title !== undefined || description !== undefined || id_company !== undefined) {
			query += " WHERE"
			if (name !== undefined) {
				search_parameters.push("%" + title + "%");
				query += " title ILIKE ($" + search_parameters.length + ") ";
			} if (description !== undefined) {
				query += title !== undefined ? " AND" : "";
				search_parameters.push("%" + description + "%");
				query += " description ILIKE ($"+ search_parameters.length+") "
			} if (id_company !== undefined) {
				query += (title !== undefined || description !== undefined) ? " AND" : "";
				search_parameters.push(id_company);
				query += " id_company = ($"+ search_parameters.length+") "
			}
		}
		if (limit !== undefined) {
			search_parameters.push(limit);
			query += " LIMIT ($" + search_parameters.length + ") ";
		}
		log.info(query); log.info(search_parameters);
		client.query(query, search_parameters, function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			res.json(result.rows); // return status code 200, application/json and query content
		});
	});	
});

app.get('/competition/:id_competition', function (req, res) {
	// Validade parameters from URL
	if (req.params.id_competition === undefined) {
		res.status(400);
		res.end("[BAD REQUEST] Invalid parameters provided.");
		return;
	}
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection
		
		// if there's no error then query db
		var query = "SELECT name, cnpj, logo FROM company WHERE id_company = ($1)";
		client.query(query, [req.params.id_competition], function(err, result) {
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

// accept DELETE request at /company/:id_company
app.delete('/competition/:id_competition', function (req, res) {
	// Validade parameters from URL
	if (req.params.id_competition === undefined) {
		res.status(400);
		res.end("[BAD REQUEST] Invalid parameters provided.");
		return;
	}
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection
		// if there's no error then query db
		var query = "DELETE FROM company WHERE id_company = ($1)";
		
		//@todo VALIDATION
		client.query(query, [req.params.id_competition], function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			res.json({success: true}); // return status code 200, application/json and query content
			res.end();
		});
	});	
});

// accept PUT request at /user
app.put('/competition/:id_competition', upload.single('image'), function (req, res) {
	// Validade parameters from request/url
	var search_parameters = [
		req.body.title,												// competition title	
		req.body.description,										// competition description
		req.body.starts, 											// competition start timestamp
		req.body.ends, 												// competition end timestamp
		1, 															// @todo id_company
		(req.file !== undefined) ? req.file.filename : undefined,	// filename in uuid format
		req.params.id_competition];									// competition id
	var v = common.is_data_valid(['string', 'string', 'timestamp', 'timestamp', 'int', 'uuid', 'int'], search_parameters);
	if (!v.success) { // verify errors in provided parameters
		res.status(400).end(v.error);
		return;
	}
	if (common.compare_timestamps(req.body.starts, req.body.ends) < 0) {
		res.status(400).end({success:false, error:"Before vs After = negative interval"});
		return;
	}
	pg.connect(connectionString, function(err, client, done) { // get a pg client from the connection pool
		if(handleError(err, done, client, res)) return false; // handle an error from the connection
				var query = "UPDATE competition SET (title, description, starts, ends, id_company, image) = "+
											"($1, $2, $3, $4, $5, $6) WHERE id_competition = ($7)";
		client.query(query, query_parameteres, function(err, result) {
			if(handleError(err, done, client, res)) return false; // handle an error from the query
			log.info("Updated company!");
			res.json({success : true});
		});
	});	
});
