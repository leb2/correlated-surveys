(function() {
	var app = angular.module('exploreApp', []);

	app.controller('ExploreController', ['$scope', '$http', '$q', function($scope, $http, $q) {

		// Only two correlatable polls for now
		$scope.pollsToCorrelate = [{}, {}];

		$scope.correlateData = function() {
			console.log($scope.pollsToCorrelate);

			// check for null in array from newly creatd md-autocompletes
			for (var i=0; i<$scope.pollsToCorrelate.length; i++) {
				if ($scope.pollsToCorrelate[i] == null) { return; }
			}

			updateGraph();
		}

		$scope.findPolls = function(searchText) {

			var def = $q.defer();

			$http.get('/polls?term=' + searchText)
				.success(function(polls) {
					console.log(polls);
					def.resolve(polls);
				});

			return def.promise;
		}

		// Adds another search bar for additional polls
		$scope.addPoll = function() {
			$scope.pollsToCorrelate.push({});
		}




		/* ---------------- FILTERS ---------------- */

		$scope.filters = [{}]

		$scope.addFilter = function() {
			$scope.filters.push({});
			console.log($scope.filters);
		}

		// Called when a filter is added
		$scope.runFilters = function() {

			// TODO: Check if all filters are filled out and valid
			if (true) {
				updateGraph();
			}
		}






		/* ---------------- CHART DATA ---------------- */


		// [0] to unwrap from jQuery
		var canvas = $('#exploreGraph')[0];
		var chart = new Chart(canvas.getContext('2d'));


		// Clears previous chart by deleting and replacing the canvas
		var resetCanvas = function() {
			$('#exploreGraph').remove(); // this is my <canvas> element
			$('.graph-row').append('<canvas id="exploreGraph"><canvas>');
			//canvas = document.querySelector('#exploreGraph');

			var canvas = $('#exploreGraph')[0];
			chart = new Chart(canvas.getContext('2d'));
		}

		var updateGraph = function() {

			resetCanvas();


			/* --- Format filters into [poll_id, value(s)] --- */
			var formattedFilters =  [];
			for (var i=0; i<$scope.filters.length; i++) {
				var filter =  $scope.filters[i];

				if (filter.poll != null) {

					if (filter.poll.poll_type == 'choice poll') {
						if (filter.choice != null) {
							formattedFilters.push({});
							formattedFilters[i].value = filter.choice.id;
						}
					} else if (filter.poll.poll_type == 'slider poll') {

						// Min and max, order irrelevant - TODO: connect to inputs
						var filterRange = [1, 4];

						if (filterRange != null) {
							formattedFilters.push({})
							formattedFilters[i].value = filterRange;
						}
					}

					// Make sure a new object was pushed onto filters from the value form being valid
					if (typeof(formattedFilters[i]) != 'undefined') {
						formattedFilters[i].pollId = filter.poll.id;
					}
				}
			}

			// Extract ids out of selected polls
			var data = [];
			for (var i=0; i<$scope.pollsToCorrelate.length; i++) {
				data[i] = $scope.pollsToCorrelate[i].id;
			}

			// TODO: Move to separate files with other color constants
			var colors = ['#F7464A', '#5AD3D1', '#FFC870', '#6DF778'];
			var highlights = ['#DE3F42', '#4FBAB8', '#E6B465', '#61DE6C'];
			console.log("URL: " + '/correlate/?ids=' + JSON.stringify(data) + '&filters=' + JSON.stringify(formattedFilters));

			$http.get('/correlate/?ids=' + JSON.stringify(data) + '&filters=' + JSON.stringify(formattedFilters))
				.success(function(data) {

					var graphDatasets = [];
					for (var i=0; i<data.datasets.length; i++) {
						var dataset = data.datasets[i];
						graphDatasets.push({
							label: dataset.label,
							data: dataset.values,
							fillColor: "rgba(220,220,220,0.2)",
							// strokeColor: "rgba(220,220,220,1)",
							strokeColor: colors[i % colors.length],
							pointColor: "rgba(220,220,220,1)",
							pointStrokeColor: "#fff",
							pointHighlightFill: "#fff",
							pointHighlightStroke: "rgba(220,220,220,1)"
						});
					}

					var graphData = {
						labels: data.labels,
						datasets: graphDatasets
					};

					if (data.type == 'line') {
						chart.Line(graphData);
					} else if (data.type == 'bar') {
						chart.Bar(graphData);
					}
				});
		};
	}]);
})();
