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

// ---- [start of imports] ----
// Main Imports - Express and App
var app 		= require('../server');
// Database related imports
var pgp 		= require('./pgp');
var db 			= pgp.db;
// Logging related imports
var common 				= require('./common');
var log			= common.log;
// Config related imports
var cfg 		= require('./config');
// Uniqueness related imports
var uuid 		= require('node-uuid');
// File upload related imports
var fs 			= require('fs');
var multer  	= require('multer');
var upload 		= multer({
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
			cb(null, 'uploads/competition/');
		},
		filename: function (req, file, cb) {
			if(file) {
				cb(null, uuid.v4() +"."+ file.mimetype.split('/')[1]);
			}
		}
	}),
	limits: { fileSize: cfg.DEFAULT_MAXIMUM_UPLOAD_LIMIT_COMPANY * 1024 * 1024 }
});
// ---- [end of imports] ----

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
app.post('/api/v1/competitions', upload.single('image'), function(req, res){
	var q_params = [
		req.body.title,												// competition title	
		req.body.description,										// competition description
		req.body.starts, 											// competition start timestamp
		req.body.ends, 												// competition end timestamp
		req.body.id_company, 										// @todo id_company
		(req.file !== undefined) ? req.file.filename : undefined];	// filename in uuid format
		
	verifyParams(['string', 'string', 'timestamp', 'timestamp', 'int', 'uuid'], q_params, res);
	
	if (common.compare_timestamps(req.body.starts, req.body.ends) < 0) {
		res.status(400).end({success:false, error:"Before vs After = negative interval"});
		return;
	}
	
	var q = "INSERT INTO competition (title, description, starts, ends, posted, id_company, image) VALUES "+
			"($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6) RETURNING id_competition";
	
	db.one(q, q_params) // query oneOrNone
	.then(function(data){
		log.info("Created competition with id: " + data.id_competition);
		res.set({'ETag': data.id_competition});
		res.status(201).end();
	});
});

/** LIMIT WITHOUT NEED OF PARAMETERS **/
app.get('/api/v1/competitions', function (req, res) {
	var q = "SELECT t.title, t.image, c.name, c.id_company FROM competition t, company c WHERE c.id_company = t.id_company";
	var q_params = new Array();
	
	// Get parameters from URL
	title = req.query.title;
	description = req.query.description;
	company = req.query.company;
	order = req.query.order;
	limit = req.query.limit;
	offset = req.query.offset;
	
	if (title !== undefined || company !== undefined || description !== undefined) {
		q += " AND "
		// [optional] title
		if (title !== undefined) {
			q_params.push("%" + title + "%");
			q += " t.title ILIKE ($" + q_params.length + ") ";
		}
		// [optional] description
		if (description !== undefined) {
			q_params.push("%" + description + "%");
			q += title !== undefined ? " AND" : "";
			q += " t.description ILIKE ($" + q_params.length + ") ";
		}
		// [optional] company
		if (company !== undefined) {
			q_params.push(company);
			q += (title !== undefined || description !== undefined) ? " AND" : "";
			q += " c.name ILIKE ($" + q_params.length + ") ";
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

app.get('/api/v1/competitions/:id_competition', function (req, res) {
	// Validade parameters from URL
	var id_competition = req.params.id_competition;
	var q = "DELETE FROM competition WHERE id_competition = ($1);";

	if (id_competition === undefined || isNaN(id_competition)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided.");
	}
	
	db.one(q, [id_competition])
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

// accept DELETE request at /company/:id_company
app.delete('/api/v1/competitions/:id_competition', function (req, res) {
	// Validade parameters from URL
	var id_competition = req.params.id_competition;
	var q = "DELETE FROM competition WHERE id_competition = ($1);";

	if (id_competition === undefined || isNaN(id_competition)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided.");
	}
	
	db.none(q, [id_competition])
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

// accept PUT request at /user
app.put('/api/v1/competitions/:id_competition', upload.single('image'), function (req, res) {
	// Validade parameters from request/url
	var q_params = [
		req.body.title,												// competition title	
		req.body.description,										// competition description
		req.body.starts, 											// competition start timestamp
		req.body.ends, 												// competition end timestamp
		req.body.id_company, 										// @todo id_company
		(req.file !== undefined) ? req.file.filename : undefined,	// filename in uuid format
		req.params.id_competition];									// id_competition

	verifyParams(['string', 'string', 'timestamp', 'timestamp', 'int', 'uuid', 'int'], q_params, res);
	
	var q = "UPDATE competition competition_new SET (title, description, starts, ends, id_company, image) = "+
			"($1, $2, $3, $4, $5, $6) FROM competition competition_old WHERE "+
			"competition_new.id_competition = competition_old.id_competition AND competition_new.id_competition = ($6) " + 
			"RETURNING competition_old.image";
	
	if (req.file === undefined) {
		q = "UPDATE competition SET (title, description, starts, ends, id_company) = "+
			"($1, $2, $3, $4, $5) WHERE id_competition = ($6);";
		q_params.splice(q_params.indexOf(undefined),1); // remove undefined
	}
	
	db.oneOrNone(q, q_params) // query oneOrNone
	.then(function(data){
		if (req.file_path !== undefined) // if file uploaded, delete old file
			fs.unlink('./uploads/competition/'+data.file_path);
		
		log.info("Updated competition!");
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