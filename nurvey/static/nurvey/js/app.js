(function() {
	var app = angular.module('nurveyApp', ['ngRoute', 'ngMaterial', 'CreateApp']);

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
		});
	}]);



	// Controller for Navbar
	app.controller('NavbarController', ['$scope', '$http', function($scope, $http) {
		$scope.username = "";

		this.refreshUsername = function() {
			$http.get('/username/').success(function(data, status, headers, config) {
				$scope.username = data;
			})
		}
	}]);

	// Controller for Account View
	app.controller('AccountController', ['$scope', '$http', function($scope, $http) {
		this.logout = function() {
			$http.get('/logout/');
		}
	}]);

	// Controller for Login Modal
	// TODO: Move to separate file
	app.controller('LoginController', ['$scope', '$http', function($scope, $http) {
		$scope.credentials = {
			username: '',
			password: '',
			email: '',
		}

		$scope.verifyAccount = function(location) {
			$http.post('/' + location + '/', $scope.credentials).
				success(function(data, status, headers, config) {
					$('#login-modal').modal('hide');
				});
		};

		this.login = function() {$scope.verifyAccount('login');};
		this.register = function() {$scope.verifyAccount('register');};
	}]);

})(); 
