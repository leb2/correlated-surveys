(function() {

	var app = angular.module('feedApp', []);


	/* ----------------- MAIN CONTROLLER FOR FEED ----------------- */


	// TODO: Changing url routing info depending on current survey for bookmarking etc.

	app.controller('FeedController',
		['$location', '$routeParams', '$rootScope', '$scope', '$http',
		function($location, $routeParams, $rootScope, $scope, $http) {

		$rootScope.location = 'Feed'

		$scope.loadedSurveys = [];
		$scope.surveyLocation = 0;

		$scope.survey = {};

		$scope.deleteSurvey = function(poll) {
			console.log("Deleteing Survey instead");
			$http.get('/delete-survey', {params: {'id': poll.survey.id}})
				.success(function() {
					$scope.loadedSurveys.splice($scope.surveyLocation,1);
					$scope.displaySurvey();
				});
		};

		$scope.deletePoll = function(poll) {
			if ($scope.survey.poll_set.length == 1) {
				$scope.deleteSurvey(poll);
				return;
			}
			$http.get('/delete-poll', {params: {'id': poll.id}})
				.success(function() {
					$scope.survey.poll_set.splice($scope.survey.poll_set,1);
				});
		}



		$scope.loginNextUser = function() {
			$http.get('/login_next_user?username=' + $rootScope.user.username)
				.success(function() {
						$rootScope.refreshUser();
						$scope.survey.showResults = false;
				});
		};


		// Submits the user's survey response
		$scope.submit = function() {

			// Login Required
			if (!$rootScope.user) {
				$('#login-modal').modal();
				return;
			}

			var answers = {};
			var polls = $scope.survey.poll_set;

			for (var i in polls) {
				var poll = polls[i];
				answers[poll.id] = poll.value;
			}

			$http.post('/surveys/' + $scope.survey.id + '/', answers).
				success(function(data, a, b, c) {
					$scope.survey.showResults = true;
					$scope.survey.has_voted = true;
				});
		};



		// Sets the scope's survey to the target survey from $scope.surveyLocation
		$scope.displaySurvey = function() {

			$scope.survey = $scope.loadedSurveys[$scope.surveyLocation];

			// Encodes survey id into url
			$location.search('survey', $scope.survey.id);

			// Loads graph if user has already voted
			$scope.survey.showResults = $scope.survey.has_voted;

			// Do not remove this line - it is very useful
			console.log("This is the survey:");
			console.log($scope.survey);

			$scope.survey.base_num_upvotes = $scope.survey.num_upvotes;
			$scope.survey.base_num_downvotes = $scope.survey.num_downvotes;

			$scope.survey.isOwned = $rootScope.user.username == $scope.survey.owner.username;

			// Gets the users current vote
			// TODO: Add to serialization in backend
			$http.get('/points/?id=' + $scope.survey.id).
				success(function(data, status, config, headers) {
					$scope.survey.voteData = data;

					if (data.survey_vote == true) {
						$scope.survey.base_num_upvotes -= 1;
					} else if (data.survey_vote == false) {
						$scope.survey.base_num_downvotes -= 1;
					}

				});
		};




		$scope.givePoint = function(isUp) {

			// Login required
			if (!$rootScope.user) {
				$('#login-modal').modal();
				return;
			}

			// Handle un-voting
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


		// Returns the number of upvotes of the scope's survey to display
		$scope.voteAmount = function() {
			var score = $scope.survey.base_num_upvotes - $scope.survey.base_num_downvotes;


			function voteToInt(vote) {
				if (vote == null) {
					return 0;
				} else {
					return vote ? 1 : -1;
				}
			}

			// In case voteData is not defined. TODO: Use promises
			try {
				return score + voteToInt($scope.survey.voteData.survey_vote);
			} catch (e) {
				return 0;
			}

			// Undoes previous vote and applies new vote
			// var previousVote = $scope.survey.voteData.survey_vote;
			// return voteToInt($scope.freshVote) - voteToInt(previousVote)
		};


		// Load more surveys if approaching end of loaded survey list

		$scope.next = function() {
			$scope.surveyLocation += 1;
			$scope.displaySurvey();

			fetchIfNearEnd();
		};

		$scope.previous = function() {
			$scope.surveyLocation -= 1;
			$scope.displaySurvey();
		};


		// When clicking on a particular survey on the sidebar
		$scope.gotoSurvey = function(survey) {
			$scope.surveyLocation = $scope.loadedSurveys.indexOf(survey)
			$scope.displaySurvey();

			fetchIfNearEnd()
		};

		// Make ajax request to surver for a survey
		function fetchSurveys(first, id) {
			var idParam = id ? "&id=" + id : "";

			// Tell server where you left off
			var beforeSurveyParam = first ? "" : "&beforeSurveyId=" + $scope.loadedSurveys[$scope.loadedSurveys.length - 1].id;

			$http.get('/surveys/?amount=10' + beforeSurveyParam + idParam).
				success(function(data) {

					var survey = data;

					// Initialize the survey with extra data - eventually switch to resolve?
					// survey.voteData = {survey_vote: false};


					$scope.loadedSurveys = $scope.loadedSurveys.concat(data);

					if (first) { $scope.displaySurvey(); }

					// If an id is specified, make call again without id
					if (id) { fetchSurveys(false); }
				});
		};

		function fetchIfNearEnd() {
			if ($scope.loadedSurveys.length - $scope.surveyLocation <= 5) {
				fetchSurveys(false);
			}
		};

		// If Looking at a particular survey by id
		if ($location.search().survey != undefined) {
			fetchSurveys(true, id=$location.search().survey);
		} else {
			fetchSurveys(true);
		}
	}]);






	/* ----------------- CHART SETTINGS ----------------- */


	app.controller('ResultsController', ['$scope', '$element', function($scope, $element) {

		var results = $scope.poll.results_pretty;

		$scope.noResults = results.range.every(function(element) { return element === 0 })

		var data = {
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

		var options = {
			responsive: true,
			maintainAspectRatio: false
		};

		if ($scope.poll.poll_type === 'slider poll') {
			chart.Line(data, options);

		} else if ($scope.poll.poll_type == 'choice poll') {

			if (results.domain.length >= 6 ) {
				var MAX_LABEL_LENGTH = 20;

				for (var i=0; i<data.labels.length; i++) {
					var label = data.labels[i];
					console.log(label);
					if (label.length > MAX_LABEL_LENGTH) {
						data.labels[i] = label.substring(0, MAX_LABEL_LENGTH) + "...";
					}
				}
				chart.Bar(data, options);

			} else {
				$scope.isPie = true;
				$scope.labels = results.domain;

				$scope.colors = ['#F7464A', '#5AD3D1', '#FFC870', '#6DF778'];
				var highlights = ['#DE3F42', '#4FBAB8', '#E6B465', '#61DE6C'];

				var pieData = [];

				for (var i=0; i<results.domain.length; i++) {
					pieData.push({
						color: $scope.colors[i],
						highlight: highlights[i],
						value: results.range[i],
						label: results.domain[i],
					});
				}

				// Should switch to builtin legend
				var legend = chart.Pie(pieData, options).generateLegend();
			}
		}
	}]);

	// Chart.defaults.global.responsive = true;
	// Chart.defaults.global.maintainAspectRatio = false;





	/* ----------------- SPECIFIC POLL (TEMPLATE) ----------------- */



	// The Directive for all of the poll types (so far)
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
				$scope.poll.value = [];

				$scope.polltype_mapping = {
					'slider poll': 'slider',
					'choice poll': 'choice'
				}
			},
			link: function(scope, element, attrs) {
				// Retrieves the correct template from the poll_type returned by the serialized poll model
				scope.contentUrl = '/static/assets/templates/feed/directives/' + scope.polltype_mapping[scope.poll.poll_type] + 'Question.html';
			}
		};
	});
})();
