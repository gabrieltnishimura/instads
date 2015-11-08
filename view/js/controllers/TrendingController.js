angular.module('instadsWebApp')
.controller('TrendingController', function($scope, TrendingPosts) {
	$scope.instads = new TrendingPosts('/api/v1/tposts');
});

// Hot Posts constructor function to encapsulate HTTP and pagination logic
angular.module('instadsWebApp')
.factory('TrendingPosts', function($http) {
	var TrendingPosts = function(uri) {
		this.posts = new Array();
		this.busy = false;
		this.end = false;
		this.after = 0;
		this.zerocount = 0;
		this.uri = uri;
		this.timeout = 5000; // timeout for when there are no more posts to load
	};

	TrendingPosts.prototype.nextPage = function() {
		if (this.busy) return;
		if (this.zerocount > 4) return;
		this.busy = true;

		$http.get(this.uri + '?offset=' + this.after)
		.success(function(data) {
			if (this.zerocount < 4) {
				if (data.length > 0) {
					this.end = false;
					for (var each in data) {
						this.posts.push(data[each]);
					}
					this.after += data.length;
					console.log(this.after)
				} else {
					this.end = true;
					this.zerocount++;
				}
			} else if (this.zerocount == 4){
				console.log("wait for " + this.timeout);
				setTimeout(this.undoZeroCount, this.timeout);
				this.zerocount++;
			}
			this.busy = false;
		}.bind(this))
		.error(function(data) {
			console.log('Error: ', data);
		});
	};

	TrendingPosts.prototype.undoZeroCount = function() {
		console.log("able to do it again");
		this.zerocount = 0;
	};
	
	return TrendingPosts;
});