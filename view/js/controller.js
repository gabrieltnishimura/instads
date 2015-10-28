var instads_posts = angular.module('instads_posts', ['infinite-scroll']);

instads_posts.controller('PostsController', function($scope, Instads) {
  $scope.instads = new Instads();
});

// Instads constructor function to encapsulate HTTP and pagination logic
instads_posts.factory('Instads', function($http) {
	var Instads = function() {
		this.posts;
		this.busy = false;
		this.after = 0;
		this.zerocount = 0;
		this.timeout = 5000;
	};

	Instads.prototype.nextPage = function() {
		if (this.busy) return;
		if (this.zerocount > 4) return;
		this.busy = true;

		$http.get('/api/v1/posts?offset=' + this.after)
		.success(function(data) {
			if (this.zerocount < 4) {
				if (data.length != 0) {
					if (this.posts === undefined) {
						this.posts = data;
					} else {
						this.posts.concat(data);
					}
					this.after += data.length;
				} else {
					this.zerocount++;
				}
			} else {
				console.log("wait for " + this.timeout);
				setTimeout(this.undoZeroCount, this.timeout);
			}
			this.busy = false;
		}.bind(this))
		.error(function(data) {
			console.log('Error: ' + data);
		});
	};

	Instads.prototype.undoZeroCount = function() {
		console.log("able to do it again");
		this.zerocount = 0;
	};
	
	return Instads;
});