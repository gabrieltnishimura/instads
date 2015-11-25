angular.module('instadsWebApp')
.controller('PostController', function($scope, $state, $http) {
	$scope.$state = $state;
	var id_post = $stateParams.id_post;
	console.log(id_post);
});