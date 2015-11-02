/** TEST DRIVEN DEVELOPMENT CASE: POSTS */

var common 		= require("../common");
var assert 		= common.assert;
var expect 		= common.expect;
var http 		= common.http;
var FormData 	= common.FormData;
var fs 			= common.fs;
var db			= common.db;
var moment		= common.moment;
var cfg 		= common.config;

function returnHttpRequest(form) {
	return http.request({ // creating request
		method: 'POST',
		host: 'localhost',
		port: 3000,
		path: '/api/v1/posts?access_token='+cfg.app_secret,
		headers: form.getHeaders()
	});
}

function setFormParameters(params) {
	var form = new FormData();
	if (params.title !== undefined) form.append('title', params.title);
	if (params.description !== undefined) form.append('description', params.description);
	if (params.op !== undefined) form.append('op', params.op);
	if (params.id_creator !== undefined) form.append('id_creator', params.id_creator); // ?
	if (params.id_competition !== undefined) form.append('id_competition', params.id_competition);
	if (params.post_file !== undefined) form.append('post_file', fs.createReadStream(params.post_file));
	return form;
}

describe('Instads REST API v1 - posts routes', function() {
	var request, id_post, id_competition, form, obj;
	beforeEach(function(done) {
		obj = { title: 'PODE SER PEPSI?', description: 'PODE!', id_competition: id_competition,
				post_file: './uploads/german.mp4' };
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		done();
	});
	it('Should find valid competition in database',function(done){
		db.one("SELECT id_competition FROM competition LIMIT 1", [])
		.then(function(data){
			id_competition = data.id_competition;
			done();
		}, function(reason) {
			return done(reason);
		}); // if query fails, then done() doesnt execute
	}); // it	
	it('Should return 201(CREATED) to POST request',function(done){
		form.pipe(request);
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(201);
			id_post = res.headers.etag;
			done();
		}); //request
	}); // it	
	it('Should return valid record on company using promises!', function (done) {
		db.one("SELECT id_post FROM post WHERE id_post = ($1);", [id_post])
		.then(function(data){
			done();
		}); // if query fails, then done() doesnt execute
	});	
	it('Should return 400(BAD REQUEST) to POST request with wrong id_competition',function(done){
		obj.id_competition = 'a';
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request without title',function(done){
		obj.title = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request without id_competition',function(done){
		obj.id_competition = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request without file',function(done){
		obj.post_file = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 200 to PUT with correct parameters',function(done){
		obj.title += "8";
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		request.method = 'PUT';
		request.path = '/api/v1/posts/'+id_post+'?access_token='+cfg.app_secret;
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(200);
			done();
		}); //request
	}); // it
	it('Should return 200 to PUT without post_file',function(done){
		obj.title += "asdahgahgioadogjdiogjadg";
		obj.post_file = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		request.method = 'PUT';
		request.path = '/api/v1/posts/'+id_post+'?access_token='+cfg.app_secret;
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(200);
			done();
		}); //request
	}); // it
	/*
	it('Should return 204 to DELETE',function(done){
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		request.method = 'DELETE';
		request.path = '/api/v1/posts/'+id_post+'?access_token='+cfg.app_secret;
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(204);
			done();
		}); //request
	}); // it
	it('Shouldn\'t find previously deleted company',function(done){
		db.none("SELECT * FROM post WHERE id_post = ($1);", [id_post])
		.then(function(data){
			done();
		}); //db
	}); // it
	*/
});