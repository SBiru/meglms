'use strict';

app.factory('vocabActivities', function () {
	
	return {
		beginSeeIt : function ($scope,updateCircleText) {
				/* Seeit activity */
        		$scope.remainingQuestions = $scope.totalItems;
				$scope.vocabContentRandom = (function () {


					var newArray = []
					for (var key in $scope.vocabItems) {

						newArray.push($scope.vocabItems[key]);
					}
					for (var i = newArray.length - 1; i >= 0; i--) {

						var randomIndex = Math.floor(Math.random() * (i + 1));
						var itemAtIndex = newArray[randomIndex];
						newArray[randomIndex] = newArray[i];
						newArray[i] = itemAtIndex;
						seeAttempts[i] = 0;//use this loop set all the counts to zero
					}
					return newArray;
				})();
				console.log($scope.vocabContentRandom);
				$scope.seeAnswerLocation = 0;
				$scope.seeCurrentQuestion = $scope.vocabContentRandom[$scope.seeAnswerLocation].translation;
				$scope.seeAnswer = $scope.vocabContentRandom[$scope.seeAnswerLocation].phrase;
				$scope.seeAnswerID = $scope.vocabContentRandom[$scope.seeAnswerLocation].id;
				$scope.seeIncomplete = true;
				$scope.seeResponse = '';
				$scope.correct = 0;
				$scope.incorrect = 0;
        		



				$scope.seeItHighScoreText = 'Perfect! No Mistakes';
				$scope.seeitCurrentGameText = 'Current Game';
				setPieGraph(0, $scope.totalItems);
				$scope.seeAnswered = [];
				$scope.seeSkipped = [];
				$scope.seeNotStarted = false;
				if (updateCircleText) {
        			
					var svg = d3.select("svg");
					var donut = svg.selectAll("g.nv-pie").filter(
						function (d, i) {
							return i == 1;
						});
	
	
					// Update the circle text
					donut.select("text").text(0);
					
				}
			}
	}

})