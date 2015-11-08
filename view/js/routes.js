angular.module('instadsWebApp')
.config(function($stateProvider, $urlRouterProvider, $locationProvider){
 	// in summary, $urlRouterProvider lets you handle cases where the 
	// state machine abstraction of the $stateProvider doesn’t make sense.

    $stateProvider
    .state('home',{
        url: '/',
        views: {
            'header': {
                templateUrl: '/templates/header.html'
            },
            'content': {
                templateUrl: '/templates/hot.html',
				controller: 'HotController'
            },
            'footer': {
                templateUrl: '/templates/footer.html'
            }
        }
    })
 
    .state('home.trending', {
        url: 'trending',
        views: {
            'content@': {
                templateUrl: 'templates/trending.html',
                controller: 'TrendingController'
            }
        }
    })
 
    .state('home.vote', {
        url: 'vote',
        views: {
            'content@': {
                templateUrl: 'templates/vote.html',
                controller: 'VoteController'
            }
        }
    })
 
    .state('home.competitions', {
        url: 'competitions',
        views: {
            'content@': {
                templateUrl: 'templates/competitions.html',
                controller: 'CompetitionsController'      
            }
        }
    })
	
	.state('home.post',{
        url: 'posts/:id_post',
        views: {
            'content': {
                templateUrl: '/templates/post.html',
				controller: 'PostController'
            },
        }
    })
	;
	$locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
});