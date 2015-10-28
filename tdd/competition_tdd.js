/** TEST DRIVEN DEVELOPMENT CASE: COMPETITION */

var common 		= require("../common");
var assert 		= common.assert;
var expect 		= common.expect;
var http 		= common.http;
var FormData 	= common.FormData;
var fs 			= common.fs;
var db			= common.db;
var moment		= common.moment;
				moment().format();

function returnHttpRequest(form) {
	return http.request({ // creating request
		method: 'POST',
		host: 'localhost',
		port: 3000,
		path: '/api/v1/competitions',
		headers: form.getHeaders()
	});
}

function setFormParameters(params) {
	var form = new FormData();
	if (params.title !== undefined) form.append('title', params.title);
	if (params.description !== undefined) form.append('description', params.description);
	if (params.starts !== undefined) form.append('starts', params.starts);
	if (params.ends !== undefined) form.append('ends', params.ends);
	if (params.timezone !== undefined) form.append('timezone', params.timezone);
	if (params.id_company !== undefined) form.append('id_company', params.id_company);
	if (params.image !== undefined) form.append('image', fs.createReadStream(params.image));
	return form;
}

describe('Competition API', function() {
	var request, id_competition, form, obj;
	beforeEach(function(done) {
		obj =
		{
			title: 'SUPER DUPER TITLE0', 
			description: 'desc_here0',  	
			starts: "2015-02-02 10:23",
			ends: "2015-02-03 16:23",
			timezone: 'America/Sao_Paulo',
			id_company: '97',
			image: './view/css/img/coca_cola.jpg'
		};
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		done();
	});
	it('Should return 201(CREATED) to POST request',function(done){
		form.pipe(request);

		request.on('response', function(res) {
			expect(res.statusCode).to.equal(201);
			id_competition = res.headers.etag;
			done();
		}); //request
	}); // it	
	it('Should return valid record on competition using promises!', function (done) {
		db.one("SELECT * FROM competition WHERE id_competition = ($1);", [id_competition])
		.then(function(data){
			done();
		}, function(err) {
			console.log("error", err);
		}); //db
	});	
	it('Should return 400(BAD REQUEST) to POST request with wrong start',function(done){
		obj.starts = "asd";
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request with negative time interval',function(done){
		obj.ends = "2015-02-01 10:23";
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
	it('Should return 400(BAD REQUEST) to POST request without description',function(done){
		obj.description = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request without id_company',function(done){
		obj.id_company = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request without file',function(done){
		obj.image = undefined;
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
		request.path = '/api/v1/competitions/'+id_competition;
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(200);
			done();
		}); //request
	}); // it
	it('Should return 200 to PUT without logo',function(done){
		obj.logo = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		request.method = 'PUT';
		request.path = '/api/v1/competitions/'+id_competition;
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(200);
			done();
		}); //request
	}); // it
	it('Should return 204 to DELETE',function(done){
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		request.method = 'DELETE';
		request.path = '/api/v1/competitions/'+id_competition;
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(204);
			done();
		}); //request
	}); // it
	it('Shouldn\'t find previously deleted company',function(done){
		db.none("SELECT * FROM competition WHERE id_competition = ($1);", [id_competition])
		.then(function(data){
			done();
		}); //db
	}); // it
});