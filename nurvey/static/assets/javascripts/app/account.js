(function() {

	var app = angular.module('accountApp', []);

	app.controller('AccountController', ['$scope', '$http', function($scope, $http) {

		this.logout = function() {
			$http.get('/logout/');
			window.location.replace('/');
		}
	}]);

	app.controller('LoginController', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {

		$scope.error = false;

		// Credentials for model in DOM
		$scope.credentials = {
			username: '',
			password: '',
			email: '',
		}

		$scope.verifyAccount = function(location) {
			$http.post('/' + location + '/', $scope.credentials).
				success(function(data) {
					$('#login-modal').modal('hide');
					$rootScope.refreshUser();
					$scope.error = false;
				}).
				error(function(data) {
					$scope.error = true;
				});
		};

		this.login = function() {$scope.verifyAccount('login');};
		this.register = function() {$scope.verifyAccount('register');};
	}]);


})();
