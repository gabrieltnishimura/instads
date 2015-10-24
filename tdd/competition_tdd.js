var http = require('http');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var options = {
  host: 'localhost',
  path: '/posts',
  port: '3000',
};

describe('/posts', function(){
	it('should respond successfully to GET',function(done){
		var req = http.get(options, function(res) {
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));
			expect(res.statusCode).to.equal(200);
			// Buffer the body entirely for processing as a whole.
			var bodyChunks = [];
			res.on('data', function(chunk) {
				// You can process streamed parts here...
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				console.log('BODY: ' + body);
				done();
			})
		});

		req.on('error', function(e) {
			console.log('ERROR: ' + e.message);
		});
	});
});