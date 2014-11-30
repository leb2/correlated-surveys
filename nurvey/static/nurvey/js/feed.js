(function() {

	var app = angular.module('feedApp', []);





	/* ----------------- MAIN CONTROLLER FOR FEED ----------------- */


	app.controller('FeedController', ['$routeParams', '$scope', '$http', function($routeParams, $scope, $http) {

		$scope.showResults = false;
		$scope.loadedSurveys = [];
		$scope.surveyLocation = 0;


		$scope.submit = function() {
			var answers = {};
			var polls = $scope.survey.poll_set;

			for (var i in polls) {
				var poll = polls[i]
					answers[poll.id] = poll.value;
			}

			$http.post('/surveys/' + $scope.survey.id + '/', answers).
				success(function(data, a, b, c) {
					$scope.showResults = true;
				});
		};

		$scope.displaySurvey = function() {
			// $scope.survey = $scope.loadedSurveys.shift();
			$scope.survey = $scope.loadedSurveys[$scope.surveyLocation];

			// Gets the users current vote
			$http.get('/points/?id=' + $scope.survey.id).
				success(function(data, status, config, headers) {
					$scope.survey.voteData = data;
					console.log($scope.survey.voteData);

					// Undoing previous vote — Checking against null
					if ($scope.survey.voteData.survey_vote == true) {
						$scope.survey.num_upvotes -= 1;
					} else if ($scope.survey.voteData.survey_vote == false) {
						$scope.survey.num_downvotes -= 1;
					}
				});
		};

		$scope.gotoSurvey = function(survey) {
			$scope.surveyLocation = $scope.loadedSurveys.indexOf(survey)

			$scope.displaySurvey();
		};

		$scope.givePoint = function(isUp) {
			// If they are unvoting
			if (isUp == $scope.survey.voteData.survey_vote) {
				$scope.survey.voteData.survey_vote = null;
			} else {
				$scope.survey.voteData.survey_vote = isUp;
			};

			data = {
				'id': $scope.survey.id,
				'isUp': isUp,
				'targetType': 'survey'
			}
			$http.post('/points/', data);
		};

		$scope.voteAmount = function() {

			var score = $scope.survey.num_upvotes - $scope.survey.num_downvotes;

			function voteToInt(vote) {
				if (vote == null) {
					return 0;
				} else {
					return vote ? 1 : -1;
				}
			}

			return score + voteToInt($scope.survey.voteData.survey_vote);

			// Undo previous vote and apply new vote
			var previousVote = $scope.survey.voteData.survey_vote;
			return voteToInt($scope.freshVote) - voteToInt(previousVote)

		};

		$scope.next = function() {
			$scope.surveyLocation += 1;
			$scope.displaySurvey();
			if ($scope.loadedSurveys.length - $scope.surveyLocation <= 5) {
				$scope.fetchSurveys(false);
			}
		};

		$scope.previous = function() {
			$scope.surveyLocation -= 1;
			$scope.displaySurvey();
		};

		// Make ajax request to surver for a survey
		$scope.fetchSurveys = function(first, completeCallback, id=0) {
			idParam = id ? "&id=" + id : "";
			$http.get('/surveys/?amount=10' + idParam).
				success(function(data, a, b, c) {
					$scope.loadedSurveys = $scope.loadedSurveys.concat(data);
					console.log($scope.loadedSurveys);

					if (first) {
						$scope.displaySurvey();
					}

					// If an id is specified, make call again without id
					if (id) {
						$scope.fetchSurveys(false);
					}
				});
		};

		if ($routeParams.id != undefined) {
			$scope.fetchSurveys(true, id=$routeParams.id);

		} else {
			$scope.fetchSurveys(true);
		}
	}]);






	/* ----------------- CHART SETTINGS ----------------- */


	app.controller('ResultsController', ['$scope', '$element', function($scope, $element) {

		var results = $scope.poll.results_pretty;

		data = {
			labels: results.domain, 
			datasets: [{
				label: "My First dataset",
				fillColor: "rgba(220,220,220,0.2)",
				strokeColor: "rgba(220,220,220,1)",
				pointColor: "rgba(220,220,220,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: results.range

			}]
		};

		var canvas = $element.find('canvas')[0];
		var chart = new Chart(canvas.getContext('2d'));

		if ($scope.poll.poll_type === 'slider poll') {
			chart.Line(data);
		} else if ($scope.poll.poll_type == 'choice poll') {
			if (results.domain.length >= 4 ) {
				chart.Bar(data);
			} else {

				colors = ['#F7464A', '#5AD3D1', '#FFC870', '#6DF778'];
				highlights = ['#DE3F42', '#4FBAB8', '#E6B465', '#61DE6C']

				var pieData = [];
				
				for (var i=0; i<results.domain.length; i++) {
					pieData.push({
						color: colors[i],
						highlight: highlights[i],
						value: results.range[i],
						label: results.domain[i],
					});
				}

				var legend = chart.Pie(pieData).generateLegend();
			}
		}
	}]);

	Chart.defaults.global.responsive = true;
	Chart.defaults.global.maintainAspectRatio = false;





	/* ----------------- SPECIFIC POLL ----------------- */


	app.directive('specificPoll', function() {

		return {
			restrict: 'E',
			template: '<div ng-include="contentUrl"></div>',
			scope: {
				questiontype: '=',
				poll: '='
			},
			controller: function($scope) {
				$scope.question = $scope.poll.poll_object;
				$scope.poll.value = null;

				$scope.polltype_mapping = {
					'slider poll': 'slider',
					'choice poll': 'choice'
				}
			},
			link: function(scope, element, attrs) {
				scope.contentUrl = '/static/nurvey/directives/' + scope.polltype_mapping[scope.poll.poll_type] + 'Question.html';
			}
		};
	});



})();
