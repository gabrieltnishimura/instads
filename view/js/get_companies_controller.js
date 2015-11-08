angular.module('instadsWebApp')
.controller('CompaniesController', function($scope, $http) {
	var companies = new Array();
	$http.get('/api/v1/companies')
	.success(function(data) {
		for (var each in data) {
			companies.push(data[each]);
		}
	})
	.error(function(data) {
		console.log('Error: ' + data);
	});
	$scope.companies = companies;
});