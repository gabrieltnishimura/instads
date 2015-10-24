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
var express = require("express");
var app = module.exports = express(); // we export new express app here!

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
			cb(null, 'uploads/company/');
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

function sendStatus500Error(res) {
	res.writeHead(500, {'content-type': 'text/plain'});
	res.end('Server internal error. ');
}

/** Demo upload page! */
app.get('/post_company', function (req, res) {
	// show a file upload form
	res.end('<html><body><form action="/api/v1/companies" enctype="multipart/form-data" method="POST">'+
		'<input type="text" placeholder="Nome da empresa" name="name" /><br>'+
		'<input type="text" placeholder="CNPJ" name="cnpj" /><br>'+
		'<input type="file" name="logo" /><br>'+
		'<input type="submit" value="Upload" />'+
		'</form></body></html>');
});

/** POST ROUTE -- MUST PROVIDE ALL PARAMETERS IN ORDER TO WORK **/
app.post('/api/v1/companies', upload.single('logo'), function(req, res) {
	var q_params = [req.body.name, 											// company name
					req.body.cnpj, 										  	// company cnpj
					req.file !== undefined ? req.file.filename : undefined];// filename in uuid format
	var v = common.is_data_valid(['string', 'cnpj', 'uuid'], q_params);
	if (!v.success) { // verify errors in provided parameters
		res.status(400).end(v.error);
		return;
	}
	
	// query posgres for one result
	db.one("INSERT INTO company (name, cnpj, logo) VALUES ($1, $2, $3) RETURNING id_company", q_params)
		.then(function(data){
			log.info("Created company with id: " + data.id_company);
			res.set({'ETag': data.id_company});
			res.status(201).end();
		}, function(reason){
			log.error(reason);
			sendStatus500Error(res);
		});	
});

// accept GET request at /api/v1/companies
app.get('/api/v1/companies', function (req, res) {
	var q = "SELECT * FROM company";
	var q_params = new Array();
	
	// Get parameters from URL
	name = req.query.name;
	limit = req.query.limit;
	offset = req.query.offset;
	
	// [optional] name
	if (name !== undefined) {
		q_params.push("%" + name + "%");
		q += " WHERE name ILIKE ($" + q_params.length + ") ";
	}

	// Limit has to be a number
	if (limit !== undefined && isNaN(limit))
		res.status(400).end("Limit provided is not a integer number. Please refer to documentation or provide a integer.");

	// Offset has to be a number
	if (offset !== undefined && isNaN(offset))
		res.status(400).end("Offset provided is not a integer number. Please refer to documentation or provide a integer.");

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
			sendStatus500Error(res);
		});
});

// accept GET request at /api/v1/companies/:id_company
app.get('/api/v1/companies/:id_company', function (req, res) {
	// Validade parameters from URL
	var id_company = req.params.id_company;
	var q = "SELECT name, cnpj, logo FROM company WHERE id_company = ($1)";
	
	if (id_company === undefined || isNaN(id_company)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided.");
	}
	
	db.one(q, [id_company])
		.then(function(data){
			res.json(data);
		}, function(reason){
			if (reason.indexOf('No data returned from the query.') != -1) {
				res.status(404).end("Resource not found");
			}
			log.error(reason);
			sendStatus500Error(res);
		});
});

// accept DELETE request at /api/v1/companies/:id_company
app.delete('/api/v1/companies/:id_company', function (req, res) {
	// Validade parameters from URL
	var id_company = req.params.id_company;
	var q = "DELETE FROM company WHERE id_company = ($1);";

	if (id_company === undefined || isNaN(id_company)) {
		res.status(400).end("[BAD REQUEST] Invalid parameters provided.");
	}
	
	db.none(q, [id_company])
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

// accept PUT request at /api/v1/companies/:id_company
app.put('/api/v1/companies/:id_company', upload.single('logo'), function (req, res) {
	// Validade parameters from request/url
	var q_params = [req.body.name, 											// company name
					req.body.cnpj, 										  	// company cnpj
					req.file !== undefined ? req.file.filename : undefined,	// filename in uuid format
					req.params.id_company];									// company id
	verifyParams(['string', 'cnpj', 'uuid_optional', 'int'], q_params, res);

	var q = "UPDATE company com_new SET (name, cnpj, logo) = ($1, $2, $3) " +
			"FROM company com_old WHERE com_old.id_company = com_new.id_company AND com_new.id_company = ($4) " +
			"RETURNING com_old.logo;"
	if (req.file === undefined) {
		q = "UPDATE company SET (name, cnpj) = ($1, $2) WHERE id_company = ($3);";
		q_params.splice(q_params.indexOf(undefined),1); // remove undefined
	}
	
	db.oneOrNone(q, q_params) // query oneOrNone
	.then(function(data){
		if (req.file !== undefined)
			fs.unlink('./uploads/company/'+data.logo);
		
		log.info("Updated company! ");
		res.status(200).json({success : true});
	});
});

function verifyParams(types, vars, res) {
	var v = common.is_data_valid(types, vars);
	if (!v.success) { // verify errors in provided parameters
		res.status(400).end(v.error);
	}
}