(function() {
	var app = angular.module('nurveyApp', ['ngRoute', 'ngMaterial', 'feedApp', 'accountApp', 'CreateApp']);

	app.config(['$routeProvider', function($routeProvider) {
		$routeProvider.when('/create', {
			templateUrl: '/static/create/templates/index.html',
			controller: 'surveyController',
			controllerAs: 'survey'
		})
		.when('/account', {
			templateUrl: '/static/nurvey/directives/account/accountView.html',
			controller: 'AccountController',
			controllerAs: 'account'
		})
		.when('/feed', {
			templateUrl: '/static/nurvey/directives/feed/feedView.html',
			controller: 'FeedController',
			controllerAs: 'feed'
		})
		.when('/feed/:id', {
			templateUrl: '/static/nurvey/directives/feed/feedView.html',
			controller: 'FeedController',
			controllerAs: 'feed'
		})
		.when('/correlate', {
			templateUrl: '/static/nurvey/directives/correlate/correlateController.html',
			controller: 'CorrelateController',
			controllerAs: 'correlate'
		})
		.when('/', {
			templateUrl: '/static/nurvey/directives/landing.html',
		});
	}]);



	// Controller for Navbar
	app.controller('NavbarController', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {


		$rootScope.refreshUser = function() {
			console.log("REFreshing user");
			$http.get('/users/').success(function(data) {
				$rootScope.user = data;
				console.log("User refreshed");
			});
		};

		$rootScope.refreshUser();
	}]);

})(); 
