var app 	= require('../server');
var common 	= require('../common');
var path 	= common.path;
var fs 		= common.fs;

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