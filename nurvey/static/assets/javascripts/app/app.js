(function() {
	var app = angular.module('nurveyApp', ['ngRoute', 'ngMaterial', 'feedApp', 'accountApp', 'CreateApp']);


	app.config(['$routeProvider', function($routeProvider) {

		$routeProvider.when('/create', {
			templateUrl: '/static/assets/templates/create/index.html',
			controller: 'surveyController',
			controllerAs: 'survey'
		})
		.when('/account', {
			templateUrl: '/static/assets/templates/account/index.html',
			controller: 'AccountController',
			controllerAs: 'account'
		})
		.when('/feed', {
			templateUrl: '/static/assets/templates/feed/index.html',
			controller: 'FeedController',
			controllerAs: 'feed'
		})
		.when('/feed/:id', {
			templateUrl: '/static/assets/templates/feed/index.html',
			controller: 'FeedController',
			controllerAs: 'feed'
		})
		.when('/correlate', {
			templateUrl: '/static/nurvey/directives/correlate/correlateController.html',
			controller: 'CorrelateController',
			controllerAs: 'correlate'
		})
		.when('/', {
			templateUrl: '/static/assets/templates/index/index.html',
		});
	}]);




	// Controller for Navbar
	app.controller('NavbarController', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {


		$rootScope.refreshUser = function() {
			$http.get('/users/').success(function(data) {
				$rootScope.user = data;
				console.log("User refreshed");
			});
		};

		$rootScope.refreshUser();
	}]);

})(); 