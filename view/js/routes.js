angular.module('instadsWebApp')
.config(function($stateProvider, $urlRouterProvider, $locationProvider){
  $stateProvider
    .state('home',{
        abstract: true,
		template: '<ui-view/>',
        views: {
            'header': {
                templateUrl: 'templates/header.html'
            },
            'footer': {
                templateUrl: 'templates/footer.html'
            }
        }
    })
	.state('home.hot', {
        url: '/',
        views: {
            'content@': {
                templateUrl: 'templates/homeHot.html',
                controller: 'HotController'
            }
        }
    })
    .state('home.trending', {
        url: '/trending',
        views: {
            'content@': {
                templateUrl: 'templates/homeTrending.html',
                controller: 'TrendingController'
            }
        }
    })
    .state('home.vote', {
        url: '/vote',
        views: {
            'content@': {
                templateUrl: 'templates/homeVote.html',
                controller: 'VoteController'
            }
        }
    })
    .state('home.competitions', {
        url: '/competitions',
        views: {
            'content@': {
                templateUrl: 'templates/homeCompetitions.html',
                controller: 'CompetitionsController'      
            }
        }
    })
    .state('home.search', {
        url: '/search',
        views: {
            'content@': {
                templateUrl: 'templates/homeSearch.html',
                controller: 'SearchController'      
            }
        }
    });
	
	$stateProvider
	.state('reader',{
        abstract: true,
		template: '<ui-view/>',
        views: {
            'header': {
                templateUrl: 'templates/header.html'
            },
            'footer': {
                templateUrl: 'templates/footer.html'
            }
        }
    })
	.state('reader.post',{
        url: '/post/:id_post',
        views: {
            'content': {
                templateUrl: 'templates/post.html',
				controller: 'PostController'
            },
        }
    });
	
	$locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
});