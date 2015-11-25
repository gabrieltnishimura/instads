angular.module('instadsWebApp')
.controller('HotController', function($scope, $state, HotPosts, URI) {
	$scope.$state = $state;
	$scope.instads = new HotPosts();
	$scope.getVideoSrc = function (videoSrc) {
		return  URI.video + videoSrc;
	};
	$scope.getImageSrc = function (imageSrc) {
		return URI.photo + imageSrc;
	};
	$scope.playOrPause = function(e) {
		var v = angular.element("#video"+e)[0];
		if (v.paused) {
			v.play();
		} else {
			v.pause();
		}
	}
});

// Hot Posts constructor function to encapsulate HTTP and pagination logic
angular.module('instadsWebApp')
.factory('HotPosts', function($http) {
	var HotPosts = function() {
		this.posts = new Array();
		this.busy = false;
		this.end = false;
		this.after = 0;
		this.zerocount = 0;
		this.timeout = 5000; // timeout for when there are no more posts to load
	};

	HotPosts.prototype.nextPage = function() {
		if (this.busy) return;
		if (this.zerocount > 4) return;
		this.busy = true;

		$http.get('/api/v1/posts?limit=4&offset=' + this.after) // promise
		.success(function(data) {
			if (this.zerocount < 4) {
				if (data.length > 0) {
					this.end = false;
					for (var each in data) {
						this.posts.push(data[each]);
					}
					this.after += data.length;
					console.log(this.after);
					this.busy = false;
				} else {
					this.end = true;
					this.zerocount++;
					this.busy = false;
				}
			} else {
				console.log("Reached end of page and query is empty. Wait for [" + this.timeout + "ms]");
				setTimeout(this.undoZeroCount, this.timeout);
				this.zerocount++;
				this.busy = false;
			}
		}.bind(this))
		.error(function(data) {
			console.log('Error: ', data);
		});
	};

	HotPosts.prototype.undoZeroCount = function() {
		this.zerocount = 0;
	};
	
	return HotPosts;
});