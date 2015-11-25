angular.module('instadsWebApp')
.controller('NavigationController', function($scope, $state) {
	$scope.$state = $state;
});