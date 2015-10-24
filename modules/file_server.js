var fs = require('fs');
var express = require("express");
var app 		= require('../server');
var UPLOAD_PATH = "C:/Users/U/Desktop/instads/uploads";
var UPLOAD_PATH_COMPANY = "C:/Users/U/Desktop/instads/uploads/company";
var UPLOAD_PATH_USER = "C:/Users/U/Desktop/instads/uploads/user";
var UPLOAD_PATH_POST = "C:/Users/U/Desktop/instads/uploads/post";
var UPLOAD_PATH_COMPETITION = "C:/Users/U/Desktop/instads/uploads/competition";
var common = require('./common');
var path = require('path');

/** Serve images through node */
app.get('/api/v1/file/company/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
		fs.exists(path.join(UPLOAD_PATH_COMPANY, req.params.filename), function(exists) {
			console.log(exists);
			if (exists) {
				fs.createReadStream(path.join(UPLOAD_PATH_COMPANY, req.params.filename)).pipe(res);
			} else {
				res.status(404);
				res.end("Error 404: Not found!");
			}
		});
	} else {
		res.status(404);
		res.end("Error 404: Not found!");
	}
});


/** Serve images through node */
app.get('/api/v1/file/post/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
		fs.exists(path.join(UPLOAD_PATH_POST, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(UPLOAD_PATH_POST, req.params.filename)).pipe(res);
			} else {
				res.status(404);
				res.end("Error 404: Not found!");
			}
		});
	} else {
		res.status(404);
		res.end("Error 404: Not found!");
	}
});


/** Serve images through node */
app.get('/api/v1/file/user/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
		fs.exists(path.join(UPLOAD_PATH_USER, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(UPLOAD_PATH_USER, req.params.filename)).pipe(res);
			} else {
				res.status(404);
				res.end("Error 404: Not found!");
			}
		});
	} else {
		res.status(404);
		res.end("Error 404: Not found!");
	}
});


/** Serve images through node */
app.get('/api/v1/file/competition/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
		fs.exists(path.join(UPLOAD_PATH_COMPETITION, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(UPLOAD_PATH_COMPETITION, req.params.filename)).pipe(res);
			} else {
				res.status(404);
				res.end("Error 404: Not found!");
			}
		});
	} else {
		res.status(404);
		res.end("Error 404: Not found!");
	}
});