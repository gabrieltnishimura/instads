/*********************************************************
 *************************COMPANY*************************
 *********************************************************
 * Set of functions that implement CRUD operations using a 
 * postgres driver. This specific file - dao_company.js - 
 * declares methods related to the Company class, which
 * is detailed below, together with the usage of the methods
 * in a RESTful application.
 * user JSON object : 
 *	{
 *		id_company : [int],
 *		name : [string], 
 *      cnpj : [string], 
 *		logo : [string]
 *	}
 *
 
CREATE TABLE company (	id_company SERIAL PRIMARY KEY,
						name TEXT NOT NULL,
						cnpj TEXT NOT NULL,
						logo TEXT NOT NULL);
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
var path		= common.path;
// ---- [end of imports] ----

// Creating upload middleware for Company Routes
var upload 		= common.getMulterObject(
	cfg.DEFAULT_UPLOAD_DIR_COMPANY,
	cfg.DEFAULT_MAXIMUM_UPLOAD_LIMIT_COMPANY,
	['image']);

/** POST ROUTE -- MUST PROVIDE ALL PARAMETERS IN ORDER TO WORK **/
app.post('/companies', upload.single('logo'), function(req, res) {
	var q_params = [req.body.name, 											// company name
					req.body.cnpj, 										  	// company cnpj
					req.file !== undefined ? req.file.filename : undefined];// filename in uuid format

	var v = common.is_data_valid(['string', 'cnpj', 'uuid'], q_params);
	if (!v.success) { // verify errors in provided parameters
		log.info(v.error);
		if (req.file !== undefined) { // file must be deleted if parameters are wrong
			fs.unlink(cfg.DEFAULT_UPLOAD_DIR_COMPANY+req.file.filename, function(err) {
				res.status(err?500:400).end(v.error);
			});
		} else {
			res.status(400).end(v.error);
		}
	} else {
		// query posgres for one result
		db.one("INSERT INTO company (name, cnpj, logo) VALUES ($1, $2, $3) RETURNING id_company", q_params)
		.then(function(data){
			log.info("Created company with id: " + data.id_company);
			res.set({'ETag': data.id_company});
			res.status(201).end();
		}, function(reason){
			log.error(reason);
			res.status(500).end('Server internal error. ');
		});	
	}
});

// accept GET request at /api/v1/companies
app.get('/companies', function (req, res) {
	var q = "SELECT * FROM company";
	var q_params = [];
	
	// Get parameters from URL
	name = req.query.name;
	order = req.query.order;
	limit = req.query.limit;
	offset = req.query.offset;
	
	// [optional] name
	if (name !== undefined) {
		q_params.push("%" + name + "%");
		q += " WHERE name ILIKE ($" + q_params.length + ") ";
	}
	
	// ORDER BY 
	if (order !== undefined) {
		if (order == "ASC" || order == "DESC") {
			q_params.push(order);
			q += " ORDER BY name $" + q_params.length + " ";
		} else {
			res.status(400).end("Order provided isn't ASC nor DESC. Please refer to documentation or provide right parameters"); return;
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
	q_params.push(limit < cfg.DEFAULT_QUERY_LIMIT_COMPANY ? limit : cfg.DEFAULT_QUERY_LIMIT_COMPANY);
	q += " LIMIT ($" + q_params.length + ") ";
	
	// DEFAULT OFFSET is zero
	q_params.push(offset > 0 ? offset : 0);
	q += " OFFSET ($" + q_params.length + ") ";
	
	// Log Query and Parameters
	log.info(q); log.info(q_params);
	
	// Query posgtres for many results
	db.many(q, q_params)
	.then(function(data){
		res.json(data);
	}, function(reason){
		log.error(reason);
		res.status(500).end('Server internal error. ');
	});
});

// accept GET request at /api/v1/companies/:id_company
app.get('/companies/:id_company', function (req, res) {
	// Validade parameters from URL
	var id_company = req.params.id_company;
	var q = "SELECT name, cnpj, logo FROM company WHERE id_company = ($1)";
	
	if (id_company === undefined || isNaN(id_company)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided."); return;
	} else {
		db.one(q, [id_company])
		.then(function(data){
			res.json(data);
		}, function(reason){
			if (reason.indexOf('No data returned from the query.') != -1) {
				res.status(404).end("Resource not found");
			}
			log.error(reason);
			res.status(500).end('Server internal error. ');
		});
	}
});

// accept DELETE request at /api/v1/companies/:id_company
app.delete('/companies/:id_company', function (req, res) {
	// Validade parameters from URL
	var id_company = req.params.id_company;
	var q = "DELETE FROM company WHERE id_company = ($1) RETURNING logo";

	if (id_company === undefined || isNaN(id_company)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided."); return;
	} else {
		db.one(q, [id_company])
		.then(function(data){
			fs.unlink(cfg.DEFAULT_UPLOAD_DIR_COMPANY+data.logo, function (err) {
				res.status(err?500:204).json(err?{success : false}:{success : true});
			});
		}, function(reason){
			if (reason.indexOf('No data returned from the query.') != -1) {
				res.status(404).end("Resource not found");
			}
			log.error(reason);
			res.status(500).end('Server internal error. ');
		});
	}
});

// accept PUT request at /api/v1/companies/:id_company
app.put('/companies/:id_company', upload.single('logo'), function (req, res) {
	// Validade parameters from request/url
	var q_params = [req.body.name, 											// company name
					req.body.cnpj, 										  	// company cnpj
					req.file !== undefined ? req.file.filename : undefined,	// filename in uuid format
					req.params.id_company];									// company id

	var v = common.is_data_valid(['string', 'cnpj', 'uuid_optional', 'int'], q_params);
	if (!v.success) { // verify errors in provided parameters
		if (req.file !== undefined) { // file must be deleted if parameters are wrong
			fs.unlink(cfg.DEFAULT_UPLOAD_DIR_COMPANY+req.file.filename, function(err) {
				res.status(err?500:400).end(v.error);
			});
		} else {
			res.status(400).end(v.error);
		}
	} else {
		var q = "UPDATE company com_new SET (name, cnpj, logo) = ($1, $2, $3) " +
				"FROM company com_old WHERE com_old.id_company = com_new.id_company AND com_new.id_company = ($4) " +
				"RETURNING com_old.logo"
		if (req.file === undefined) {
			q = "UPDATE company SET (name, cnpj) = ($1, $2) WHERE id_company = ($3)";
			q_params.splice(q_params.indexOf(undefined),1); // remove undefined
		}
		
		db.oneOrNone(q, q_params) // query oneOrNone
		.then(function(data) {
			if (req.file !== undefined) {
				fs.unlink(cfg.DEFAULT_UPLOAD_DIR_COMPANY+data.logo, function (err) {
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
