var app 	= require('../server');
var common 	= require('../common');
var path 	= common.path;
var fs 		= common.fs;
var cfg		= common.config;

var POST_UPATH = cfg.APPDIR+cfg.DEFAULT_UPLOAD_DIR_POST;
var USER_UPATH = cfg.APPDIR+cfg.DEFAULT_UPLOAD_DIR_USER;
var COMPETITION_UPATH = cfg.APPDIR+cfg.DEFAULT_UPLOAD_DIR_COMPETITION;
var COMPANY_UPATH = cfg.APPDIR+cfg.DEFAULT_UPLOAD_DIR_COMPANY;


/** Serve images through node */
app.get('/api/v1/file/post/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
	console.log(path.join(POST_UPATH, req.params.filename));
		fs.exists(path.join(POST_UPATH, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(POST_UPATH, req.params.filename)).pipe(res);
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
		fs.exists(path.join(USER_UPATH, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(USER_UPATH, req.params.filename)).pipe(res);
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
		fs.exists(path.join(COMPETITION_UPATH, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(COMPETITION_UPATH, req.params.filename)).pipe(res);
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
app.get('/api/v1/file/company/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
		fs.exists(path.join(COMPANY_UPATH, req.params.filename), function(exists) {
			console.log(exists);
			if (exists) {
				fs.createReadStream(path.join(COMPANY_UPATH, req.params.filename)).pipe(res);
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
