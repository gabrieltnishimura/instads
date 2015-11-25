// Main Imports - Express and App
var app 		= require('../../server');
// Common modules
var common 		= require('../../common');
var cfg			= common.config;
var db			= common.db;
var path		= common.path;
var log			= common.log;
var passport	= common.passport;

app.get	('/check_permissions', common.isLoggedIn, function(req, res, next) {
	res.status(200).json(req.user);
}); 

/** Demo upload page! */
app.get('/send_post', function (req, res) {
	res.sendFile(path.resolve('./view/send_post.html'));
});

/** Demo upload page! */
app.get('/post_competition', function (req, res) {
	res.sendFile(path.resolve('./view/post_competition.html'));
});

/** Demo upload page! */
app.get('/post_company', function (req, res) {
	res.end('<html><body><form action="/api/v1/companies" enctype="multipart/form-data" method="POST">'+
		'<input type="text" placeholder="Nome da empresa" name="name" /><br>'+
		'<input type="text" placeholder="CNPJ" name="cnpj" /><br>'+
		'<input type="file" name="logo" /><br>'+
		'<input type="submit" value="Upload" />'+
		'</form></body></html>');
});