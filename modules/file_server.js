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
				res.status(404).end("Error 404: Not found!");
			}
		});
	} else {
		res.status(400).end('Bad Request for file');
	}
});

/** Serve images through node */
app.get('/api/v1/file/user/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
		fs.exists(path.join(USER_UPATH, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(USER_UPATH, req.params.filename)).pipe(res);
			} else {
				res.status(404).end("Error 404: Not found!");
			}
		});
	} else {
		res.status(400).end('Bad Request for file');
	}
});


/** Serve images through node */
app.get('/api/v1/file/competition/:filename', function (req, res) {
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	// Validate that req.params.filename is 16 bytes hex string
		fs.exists(path.join(COMPETITION_UPATH, req.params.filename), function(exists) {
			if (exists) {
				fs.createReadStream(path.join(COMPETITION_UPATH, req.params.filename)).pipe(res);
			} else {
				res.status(404).end("Error 404: Not found!");
			}
		});
	} else {
		res.status(400).end('Bad Request for file');
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
				res.status(404).end("Error 404: Not found!");
			}
		});
	} else {
		res.status(400).end('Bad Request for file');
	}
});

/** Stream partial videos through node! */
app.get('/api/v1/video/post/:filename', function (req, res) { // demo for /api/v1/video/post/635f7aaf-75dd-4bf2-8bda-409c2f6a31e6.mp4
	if(common.is_data_valid(['uuid'], [req.params.filename])) {	
		var fileLocation = path.join(POST_UPATH, req.params.filename);
		fs.exists(fileLocation, function(exists) {
			if (exists) { 
				var total = fs.statSync(fileLocation).size;
				if (req.headers['range']) {
					var parts = req.headers.range.replace(/bytes=/, "").split("-");
					var partialstart = parts[0];
					var partialend = parts[1];

					var start = parseInt(partialstart, 10);
					var end = partialend ? parseInt(partialend, 10) : total-1;
					var chunksize = (end-start)+1;
					//console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

					var file = fs.createReadStream(fileLocation, {start: start, end: end});
					res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
					file.pipe(res);
				} else {
					console.log('ALL: ' + total);
					res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
					fs.createReadStream(fileLocation).pipe(res);
				}
			} else {
				res.status(404).end("Error 404: Not found!");
			}
		});
	} else {
		res.status(400).end('Bad Request for video');
	}
});