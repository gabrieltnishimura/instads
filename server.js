// Main Application
var express 		= require('express');
var app 			= module.exports = express();
var common 			= require('./common.js');	// Common
var bodyParser 		= common.bodyParser;	// Parsers
var cookieParser 	= common.cookieParser;
var morgan 			= common.morgan;		// Logging
var bunyan			= common.bunyan;
var log 			= common.log;
var passport		= common.passport;		// Session and Auth
var session      	= common.session;
var pgSession 		= common.pgSession;
var db 				= common.db;			// Database related imports

var server = express()
	.use('/api/v1', app) // backend is express app
	.use('/', express.static("./view")) // www is public/static files
	.all('/*', function (req, res, next) {
		res.sendFile('/view/index.html', {root: __dirname});
	})
	.listen(process.env.PORT || 3000, function () {
		var host = server.address().address;
		var port = server.address().port;
		log.info('Instads REST API listening at http://%s:%s', host, port);
	});
	
app.use(express.static("./view")); // before sessions please
app.use(cookieParser()); 		// read cookies (needed for auth)
app.use(bodyParser.urlencoded({extended: true})); // this is like super important
app.use(bodyParser.json());    	// to support JSON-encoded bodies
app.use(session({  
	store: new pgSession({
		db : db
	}),
	secret: "my secret is secret",
	cookie: { secure : false, maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days 
	resave: false,
	saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
require('./modules/api/passport')(passport);
app.use(morgan('short'));

require("./modules/api/file_server");
require("./modules/api/dao_post");
require("./modules/api/dao_user");
require("./modules/api/dao_company");
require("./modules/api/dao_competition");
require("./modules/view/desktop_view");
require("./modules/view/mobile_view");