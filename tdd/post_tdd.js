/** TEST DRIVEN DEVELOPMENT CASE: POSTS */

var http = require('http');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var FormData = require('form-data');
var fs = require('fs');
var pgp = require('pg-promise')(/*options*/);
var db = pgp("postgres://postgres:dom1nion!@127.0.0.1:5432/instads");

function returnHttpRequest(form) {
		return http.request({ // creating request
			method: 'POST',
			host: 'localhost',
			port: 3000,
			path: '/posts',
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
	if (params.file_path !== undefined) form.append('file_path', fs.createReadStream(params.file_path));
	return form;
}
 *		id_post : [int],
 *		title : [string], 
 *		description : [string]
 *		votes : [int], 
 *		id_creator : [int],
 *		mimetype : [string], 
 *		file_path : [string],
 * 		id_competition : [int]
describe('Company API', function(){
	var request, id_company, form, obj;
	beforeEach(function(done){
		obj = {name: 'Pepsi', cnpj: '84.865.945/0001-66', logo: './view/css/img/coca_cola.jpg'};
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		done();
	});
	it('Should return 201(CREATED) to POST request',function(done){
		form.pipe(request);

		request.on('response', function(res) {
			expect(res.statusCode).to.equal(201);
			id_company = res.headers.etag;
			done();
		}); //request
	}); // it	
	it('Should return valid record on company using promises!', function (done) {
		db.one("SELECT name, cnpj, logo FROM company WHERE id_company = ($1);", [id_company])
		.then(function(data){
			done();
		}); // if query fails, then done() doesnt execute
	});	
	it('Should return 400(BAD REQUEST) to POST request with wrong cnpj',function(done){
		obj.cnpj = '84.865.945/0001-56';
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request without name',function(done){
		obj.name = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request without cnpj',function(done){
		obj.cnpj = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	it('Should return 400(BAD REQUEST) to POST request without file',function(done){
		obj.logo = undefined;
		form = setFormParameters(obj);
		request = returnHttpRequest(form);
		form.pipe(request);
		
		request.on('response', function(res) {
			expect(res.statusCode).to.equal(400);
			done();
		}); //request
	}); // it
	
});