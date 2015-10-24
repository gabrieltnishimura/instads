// Main Application
var express 		= require('express');
var app 			= module.exports = express();
var https 			= require('https');
// Parsers
var bodyParser 		= require('body-parser');
var cookieParser 	= require('cookie-parser');
// Logging control
var morgan 			= require('morgan');
var bunyan			= require('bunyan');
var common 			= require('./modules/common');
var log 			= common.log;
// Auth
var config 			= require("./modules/config");
var passport		= require('passport');
var session      	= require('express-session');
var pgSession 		= require('connect-pg-promise')(session);
// Database related imports
var pgp 			= require('./modules/pgp');

var server 			= app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});

app.use(express.static("./view"));
app.use(cookieParser()); 		// read cookies (needed for auth)
app.use(bodyParser.urlencoded({extended: true})); // this is like super important
app.use(bodyParser.json());    	// to support JSON-encoded bodies
app.use(session({  
	store: new pgSession({
		db : pgp.db
	}),
	secret: "my secret is secret",
	cookie: { secure : false, maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days 
	resave: false,
	saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
require('./modules/passport')(passport);
app.use(morgan('short'));

require("./modules/file_server");
require("./modules/dao_post");
require("./modules/dao_user");
require("./modules/dao_company");
require("./modules/dao_competition");
app.set('api_secret', config.secret); // secret variable
