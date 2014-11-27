(function() {
	var app = angular.module('CreateApp', []);




	/* -------------------------------- SURVEY -------------------------------- */


	// Controller for all of the questions
	app.controller('surveyController', ['$location', '$scope', '$http', function($location, $scope, $http) {
		this.survey = {title: '', description: ''};
		var questions = this.survey.questions = this.questions = [{}];

		this.addQuestion = function() {
			questions.push({});
		};

		this.submit = function() {

			// Extracts parameters from selected questionType and assigns to new property on question
			angular.forEach(questions, function(question) {
				angular.forEach(question.questionTypes, function(questionType) {
					if (questionType.selected) {
						question.parameters = questionType.parameters;
						question.type = questionType.name;
					}
				});
				delete question.questionTypes;
			});
			console.log(questions);
			console.log(this.survey);

			$http.post('/surveys/', this.survey).
				success(function(data, status, headers, config) {
					id = data;
					$location.path('/feed/' + id);
				});
		};
	}]);



	/* -------------------------------- QUESTION -------------------------------- */


	// Directive for a single question
	app.directive('questionCreate', function() {
		return {
			restrict: 'E', 

			templateUrl: '/static/create/directives/questionCreate.html',
			scope: {
				question: '=',
				questions: '='
			},
			controller: function($scope) {

				// Specific 'create' directives have a reference to their corresponding questionType
				// 'selected' property is used to determine which specific 'create' directive is shown
				// Question parameters also stored in questionType
				$scope.question.questionTypes = $scope.questionTypes = [
					{
						name: 'choice',
						title: 'Multiple Choice',
						// Having the parameters property explicitly defined
						// neccessary to prevent ambiguous references from demo and create
						parameters: {}
					},
					{
						name: 'yesNo',
						title: 'True or False',
						parameters: {}
					},
					{
						name: 'slider',
						title: 'Range Slider',
						parameters: {}
					}
				];

				$scope.selectedTitle = "Select Question Type";

				// Selects the question type
				$scope.select = function(questionType) {

				angular.forEach($scope.questionTypes, function(questionType) {
						questionType.selected = false;
					});
					questionType.selected = true;
					$scope.selectedTitle = questionType.title;
				};

				$scope.findQuestionType = function(name) {
					return $scope.questionTypes.filter(function(obj) {
						return obj.name === name;
					})[0];
				}

				// Removes the question
				this.remove = function() {
					var questionIndex = $scope.questions.indexOf($scope.question);
					if (questionIndex > -1) {
						$scope.questions.splice(questionIndex, 1);
					}
				};
			},
			controllerAs: 'questionController'
		}
	});





	/* -------------------------------- DEMO -------------------------------- */


	// Generic directive to display demo based on question
	app.directive('demo', function() {
		return {
			restrict: 'E',
			require: '^questionCreate',
			template: '<div ng-include="contentUrl"></div>',
			scope: {
				questiontype: '='
			},
			controller: function($scope) {
				//$scope.question = $scope.$parent.question;
				$scope.question = $scope.questiontype.parameters;

			},
			link: function(scope, element, attrs) {
				scope.contentUrl = '/static/create/directives/demos/' + scope.questiontype.name + 'Question.html';
			}
		};
	});





	/* -------------------------------- SPECIFICS -------------------------------- */


	// Directive for creating a multiple choice question 
	app.directive('choiceCreate', function() {
		return {
			restrict: 'E', 
			templateUrl: '/static/create/directives/create-params/choiceCreate.html',
			scope: {
				questiontype: '='
			},
			controller: function($scope) {

				//var question = $scope.question = $scope.$parent.question;
				$scope.question = $scope.questiontype.parameters;
				$scope.choices = $scope.question.choices = [{}, {}];

				$scope.addChoice = function() {
					$scope.choices.push({});
				};

				$scope.removeChoice = function(choice) {
					var choiceIndex = $scope.choices.indexOf(choice);
					if (choiceIndex > -1) {
						$scope.choices.splice(choiceIndex, 1);
					}
				};
			},
			link: function(scope, elem, attrs) {
				scope.question = scope;
			}
		};
	});


	app.directive('sliderCreate', function() {
		return {
			restrict: 'E',
			templateUrl: '/static/create/directives/create-params/sliderCreate.html',
			scope: {
				questiontype: '='
			},
			controller: function($scope) {
				//var question = $scope.question = $scope.$parent.question;
				var question = $scope.question = $scope.questiontype.parameters; 
				$scope.min = question.min = 0;
				$scope.max = question.max = 10;
				$scope.step = question.step = 1;
			}
		};
	});


	// Directive for Yes or No questions
	app.directive('yesNoCreate', function() {
		return {
			restrict: 'E',
			templateUrl: '/static/create/directives/create-params/yesNoCreate.html',
			scope: {
				questiontype: '='
			},
			controller: function($scope) {
				var question = $scope.question = $scope.$parent.question;
			}
		};
	});


	// Skeleton for parameter directive for new question type
	// TODO: Make DRYer design 
	app.directive('typenameCreate', function() {
		return {
			restrict: 'E',
			templateUrl: '/static/create/directives/create-params/yesNoCreate.html',
			scope: {
				questiontype: '='
			},
			controller: function($scope) {
				var question = $scope.question = $scope.$parent.question;
			}
		};
	});

})();






