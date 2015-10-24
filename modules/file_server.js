var fs = require('fs');
var express = require("express");
var app = module.exports = express(); // we export new express app here!
var UPLOAD_PATH = "C:/Users/U/Desktop/instads/uploads";
var common = require('./common');
var log = common.log;
var path = require('path');

/** Serve images through node */
app.get('/files/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
	//	res.setHeader('Content-Type', storedMimeType)
		fs.exists(path.join(UPLOAD_PATH, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(UPLOAD_PATH, req.params.filename)).pipe(res);
			} else {
				res.status(404);
				res.end("Error 404: Not found!");
			}
		});
	}
});