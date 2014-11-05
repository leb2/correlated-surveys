(function() {
	var app = angular.module('CreateApp', ['ui.bootstrap']);


	// Controller for all of the questions
	app.controller('surveyController', function($scope) {
		var questions = this.questions = [{}];
		this.addQuestion = function() {
			questions.push({});
		};
	});


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

				$scope.questionTypes = [
					{
						name: 'choice',
						title: 'Multiple Choice'
					},
					{
						name: 'yesNo',
						title: 'True or False'
					}
				];

				$scope.selectedTitle = "Select Question Type";

				// Selects the question type
				$scope.select = function(questionType) {
					console.log($scope.question);
					console.log("resetting question to...");
					$scope.question = {};
					console.log($scope.$parent);
					console.log($scope.question);
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
				$scope.question = $scope.$parent.question;
			},
			link: function(scope, element, attrs) {
				scope.contentUrl = '/static/nurvey/directives/' + scope.questiontype + 'Question.html';
				//$(element).find('.checkbox').checkBo();
			},
		};
	});

	// Directive for creating a multiple choice question 
	app.directive('choiceCreate', function() {
		return {
			restrict: 'E', 
			templateUrl: '/static/create/directives/choiceCreate.html',
			scope: {
				questiontype: '='
			},
			controller: function($scope) {

				var question = $scope.question = $scope.$parent.question;
				$scope.choices = question.choices = [{}, {}];

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
			link: function(scope, element, attrs) {
				//$(element).find('.checkbox').checkBo();
			}
		};
	});


	// Directive for Yes or No questions
	app.directive('yesNoCreate', function() {
		return {
			restrict: 'E',
			templateUrl: '/static/create/directives/yesNoCreate.html',
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
			templateUrl: '/static/create/directives/yesNoCreate.html',
			scope: {
				questiontype: '='
			},
			controller: function($scope) {
				var question = $scope.question = $scope.$parent.question;
			}
		};
	});

})();






