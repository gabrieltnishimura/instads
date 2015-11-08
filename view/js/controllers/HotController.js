angular.module('instadsWebApp')
.controller('HotController', function($scope, HotPosts) {
	$scope.instads = new HotPosts();
	var uri = '/api/v1';
	$scope.getVideoSrc = function (videoSrc) {
		return  uri + '/file/video/' + videoSrc;
	};
	$scope.getImageSrc = function (imageSrc) {
		return uri + '/file/post/' + imageSrc;
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

		$http.get('/api/v1/posts?offset=' + this.after) // promise
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

	HotPosts.prototype.undoZeroCount = function() {
		console.log("able to do it again");
		this.zerocount = 0;
	};
	
	return HotPosts;
});