angular.module('instadsWebApp')
.controller('CompetitionsController', function($scope) {
	$http.get('/api/v1/posts')
		.success(function(data) {
			
		})
		.error(function(data) {
			
		});
});
