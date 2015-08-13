(function() {
	var app = angular.module('exploreApp', []);

	app.controller('ExploreController', ['$rootScope', '$scope', '$http', '$q', function($rootScope, $scope, $http, $q) {

		$rootScope.location = 'Explore'


		// Only two correlatable polls for now
		$scope.pollsToCorrelate = [{}, {}];
		$scope.placeholders = ['Age (Demo)', 'Height (Demo)'];

		$scope.correlateData = function() {

			// Make sure there is at least one poll to correlate
			if (!($scope.pollsToCorrelate[0] == null && $scope.pollsToCorrelate[1] == null)) {
				updateGraph();
			}

		}

		$scope.findPolls = function(searchText) {

			var def = $q.defer();

			$http.get('/polls?term=' + searchText)
				.success(function(polls) {
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

		/* ---------------- CHART DATA ---------------- */


		// [0] to unwrap from jQuery
		var canvas = $('#explore-graph')[0];
		var ctx = canvas.getContext('2d');
		console.log("original context sizes: height - " + ctx.canvas.height + "  width - " + ctx.canvas.width);
		var chart = new Chart(canvas.getContext('2d'));


		// Clears previous chart by deleting and replacing the canvas
		var resetCanvas = function() {
			$('#explore-graph').remove(); // this is my <canvas> element
			$('.explore-graph-container').append('<canvas id="explore-graph"><canvas>');
			//canvas = document.querySelector('#explore-graph');

			var canvas = $('#explore-graph')[0];
			chart = new Chart(canvas.getContext('2d'));
		}


		// TODO: Move to separate files with other color constants
		var colors = $scope.colors = ['#F7464A', '#5AD3D1', '#FFC870', '#6DF778'];
		var highlights = ['#DE3F42', '#4FBAB8', '#E6B465', '#61DE6C'];


		var graphData = function(data) {


			// Default data for initial demo graph
			var data = typeof(data) !== 'undefined' ? data : {
				datasets: [{values: [2,4,3,5,6,9,7,12,11,8,4]}, {values: [14,15,7,4,3,5,1,6,4,7,9]}],
				labels: [0,1,2,3,4,5,6,7,8,9,10],
				x_axis: 'Axis X',
				y_axis: 'Axis Y',
				type: 'line'
			};

			resetCanvas();

			// Needed to set axis labels
			$scope.chartData = data;

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

			var options = {
				responsive: true,
				maintainAspectRatio: false
			}

			if (data.type == 'line') {
				chart.Line(graphData, options);
			} else if (data.type == 'bar') {
				chart.Bar(graphData, options);
			}
		}

		var updateGraph = function(first) {

			/* --- Format filters into [poll_id, value(s)] objs --- */
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
						var filterRange = [filter.min, filter.max];

						if (filterRange[0] != null && filterRange[1] != null) {
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
				if ($scope.pollsToCorrelate[i] != null) {
					data[i] = $scope.pollsToCorrelate[i].id;
				}
			}

			$http.get('/correlate/?ids=' + JSON.stringify(data) + '&filters=' + JSON.stringify(formattedFilters))
				.success(function(data) {
					console.log("this is the data");
					console.log(data);
					graphData(data);
				});
		};

		graphData();

	}]);
})();
