
angular.module('instadsWebApp')
.controller('PostsController', function($scope, InstadsPosts) {
	$scope.instads = new InstadsPosts();
});

// Instads constructor function to encapsulate HTTP and pagination logic
angular.module('instadsWebApp')
.factory('InstadsPosts', function($http) {
	var InstadsPosts = function() {
		this.posts = new Array();
		this.busy = false;
		this.end = false;
		this.after = 0;
		this.zerocount = 0;
		this.timeout = 5000; // timeout for when there are no more posts to load
	};

	InstadsPosts.prototype.nextPage = function() {
		if (this.busy) return;
		if (this.zerocount > 4) return;
		this.busy = true;

		$http.get('/api/v1/posts?offset=' + this.after)
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
			console.log('Error: ' + data);
		});
	};

	InstadsPosts.prototype.undoZeroCount = function() {
		console.log("able to do it again");
		this.zerocount = 0;
	};
	
	return InstadsPosts;
});