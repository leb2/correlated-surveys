(function() {
	var app = angular.module('nurveyApp', ['ngRoute', 'CreateApp']);

	app.config(['$routeProvider', function($routeProvider) {
		$routeProvider.when('/create', {
			templateUrl: '/static/create/templates/index.html',
			controller: 'surveyController',
			controllerAs: 'survey'
		});
	}]);
})(); 
