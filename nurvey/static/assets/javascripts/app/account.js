(function() {

	var app = angular.module('accountApp', []);

	app.controller('AccountController', ['$scope', '$http', function($scope, $http) {

		this.logout = function() {
			$http.get('/logout/');
			window.location.replace('/');
		}
	}]);

	app.controller('LoginController', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {

		$scope.loginError = false;
		$scope.registerError = false;
		$scope.loginOnSubmit = true;

		// Credentials for model in DOM
		this.resetCredentials = function() {
			console.log("Resetting credentials");
			$scope.credentials = {
				username: '',
				password: '',
				email: '',
			};
		};

		this.resetCredentials();

		this.shouldLogin = function(shouldLogin) {
			this.resetCredentials();
			$scope.loginOnSubmit = shouldLogin;
		};


		this.login = function(valid) {
			if (valid) {
				$http.post('/login/', $scope.credentials).
					success(function(data) {
						$('#login-modal').modal('hide');
						$rootScope.refreshUser();
						$scope.loginError = false;
					}).
					error(function(data) {
						$scope.loginError = true;
					});
			}
		};

		this.register = function(valid) {
			console.log("Registering");
			if (valid) {
				$http.post('/register/', $scope.credentials).
					success(function(data) {
						$('#login-modal').modal('hide');
						$rootScope.refreshUser();
						$scope.registerError = false;
					}).
					error(function(data) {
						$scope.registerError = data;
					});
			} else {
				console.log("Form not valid");
			}
		};


		this.loginReddit = function() {
			$http.get('/reddit-auth-url').
				success(function(url) {
					window.location = url;
				});
		};
	}]);



	// Custom validation to tell whether username is unique
	app.directive('uniqueUsername', function($q, $http) {
		return {
			require: 'ngModel',
			link: function(scope, elm, attrs, ctrl) {
				console.log("Runing sodfthing");

				ctrl.$asyncValidators.uniqueUsername = function(modelValue, viewValue) {

					var def = $q.defer();

					$http.get('/unique-username?username=' + modelValue).
						success(function(isUnique) {
							if (isUnique) {
								def.reject();
							} else {
								def.resolve();
							}
						}).
						error(function() {
							def.reject();
						});

					return def.promise;
				};
			}
		};
	});


	// Custom validation to make sure passwords and confirmation match
	app.directive('matchPassword', function() {
		return {
			require: 'ngModel',
			link: function(scope, elm, attrs, ctrl) {
				console.log("LINKIGN");

				ctrl.$validators.matchPassword = function(modelValue, viewValue) {

					// Consider empty model valid
					if (ctrl.$isEmpty(modelValue)) { return true; console.log("Model is empty!")};
					return modelValue == scope.credentials.password;
				};
			}
		};
	});


})();
