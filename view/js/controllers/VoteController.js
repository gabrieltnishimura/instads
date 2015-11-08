angular.module('instadsWebApp')
.controller('VoteController', function($scope) {
	$http.get('/api/v1/posts')
		.success(function(data) {
			
		})
		.error(function(data) {
			
		});
});
