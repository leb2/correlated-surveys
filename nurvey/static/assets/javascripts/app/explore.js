(function() {
	var app = angular.module('exploreApp', []);

	app.controller('ExploreController', ['$scope', '$http', function($scope, $http) {

		$scope.correlateData = [];

		// Link up autocomplete search to database on server side
		$('.poll-select').autocomplete({
			minLength: 3,
			delay: 250,
			select: function(event, ui) {
				$scope.correlateData[$(this).attr('id') - 1] = ui.item.id;
				$scope.updateGraph();
			},
			source: function(request, response) {
				$http.get('/polls?term=' + request.term)
					.success(function(data) {
						var polls = data;
						for (var i=0; i<polls.length; i++) {
							var poll = polls[i];

							// Use the title property of serialized poll as label property for jQueryUI source objects
							poll.label = poll.title;
						}
						response(polls);
					});
			}
		});



		/* ---------------- CHART DATA ---------------- */

		data = {
			labels: ['pizza', 'pasta', 'cereal', 'rice', 'bread', 'cake', 'steak'], 
			datasets: [{
				label: "My First dataset",
				fillColor: "rgba(120,220,120,0.2)",
				strokeColor: "rgba(120,220,120,1)",
				pointColor: "rgba(120,220,120,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: [5, 4, 3, 5, 8, 12, 5]
			},
			{
				label: "My second dataset",
				/*
				fillColor: "rgba(220,120,120,0.2)",
				strokeColor: "rgba(220,120,120,1)",
				pointColor: "rgba(220,120,120,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				*/
				data: [1, 4, 7, 3, 4, 1, 3]
			}]
		};

		var canvas = $('#exploreGraph')[0];
		var chart = new Chart(canvas.getContext('2d'));
		// chart.Bar(data);


		$scope.updateGraph = function() {

			var data = $scope.correlateData;

			// TODO: Make having only one poll not return undfined error but submit to survey with only one
			$http.get('/correlate/?ids=' + JSON.stringify(data))
				.success(function(data) {
					var graphDatasets = [];
					for (var i=0; i<data.datasets.length; i++) {
						var dataset = data.datasets[i];
						graphDatasets.push({
							label: dataset.label,
							data: dataset.values 
						});
					}

					var graphData = {
						labels: data.labels,
						datasets: graphDatasets
					}

					console.log("graphing with data:")
					console.log(graphData);

					if (data.type == 'line') {
						chart.Line(graphData);
					} else if (data.type == 'bar') {
						chart.Bar(graphData);
					}
				});
		};



	}]);



})();
