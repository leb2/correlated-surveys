(function() {
	var app = angular.module('nurveyApp', ['ngRoute', 'ui.bootstrap', 'ngMessages', 'ngMaterial', 'exploreApp', 'feedApp', 'accountApp', 'CreateApp']);



	app.config(function($routeProvider, $mdThemingProvider) {

		$mdThemingProvider.theme('default')
			.primaryPalette('indigo')
			.accentPalette('blue');

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
		.when('/explore', {
			templateUrl: '/static/assets/templates/explore/index.html',
			controller: 'ExploreController',
			controllerAs: 'explore'
		})
		.when('/', {
			templateUrl: '/static/assets/templates/index/index.html',
			controller: 'LandingController',
			controllerAs: 'landing'
		});

	});


	// TODO: Move to separate file
	app.controller('LandingController', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {
		$rootScope.location = "";
		$scope.surveys = [];
		$http.get('/surveys/').
			success(function(data) {
				$scope.surveys = data;
				console.log($scope.surveys);
			});
	}]);

	// Directive for form validation
	app.directive('showErrors', function() {
		return {
			restrict: 'A',
			require:  '^form',
			link: function (scope, el, attrs, formCtrl) {
				var inputEl   = el[0].querySelector("[name]");
				var inputNgEl = angular.element(inputEl);
				var inputName = inputNgEl.attr('name');

				// Removes red when user is typing
				inputNgEl.bind('focus', function() {
					el.removeClass('has-error');
				});

				inputNgEl.bind('blur', function() {
					el.toggleClass('has-error', formCtrl[inputName].$invalid);
				});
			}
		};
	});

	// Controller for Navbar
	app.controller('NavbarController', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {

		$rootScope.refreshUser = function() {
			$http.get('/users/').success(function(data) {
				$rootScope.user = data;
			});
		};

		$scope.showModal = function() {
			$('#login-modal').show();
			console.log("This shoudl be getting callsdk");
		};

		$rootScope.refreshUser();
	}]);

})();
