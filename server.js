// Main Application
var express 		= require('express');
var app 			= express();
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

var server 			= app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});

app.use(express.static("./view"));
app.use(cookieParser()); 		// read cookies (needed for auth)
app.use(bodyParser.json());    	// to support JSON-encoded bodies
app.use(session({  secret: "my secret is secret",
  cookie: { secure : false, maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days 
  resave: false,
  saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
require('./modules/passport')(passport); // load our routes and pass in our app and fully configured passport
//app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('short'));

app.use(require("./modules/file_server"));
app.use(require("./modules/dao_post2"));
app.use(require("./modules/dao_user"));
app.use(require("./modules/dao_company"));
app.use(require("./modules/dao_competition"));
app.set('api_secret', config.secret); // secret variable
