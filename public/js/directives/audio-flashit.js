"use strict";

(function () {

	var app = angular.module('flashItStuff', []);

	app.directive('audioFlashIt', ['$rootScope', 'FlashITAudio', 'Vocab', '$interval', '$timeout', function ($rootScope, FlashIT, Vocab, $interval, $timeout) {

		var controller = ['$rootScope', '$scope', 'FlashITAudio', 'Vocab', '$interval', '$timeout', function ($rootScope, $scope, FlashIT, Vocab, $interval, $timeout) {

			function init() {

				$scope.playAudio = function (localVocabID) {
					localVocabID = typeof localVocabID !== 'undefined' ? localVocabID : false;
					if ($scope.flashitGameEnded)
					{
						return;
					}
					$scope.play()(localVocabID);
				}
				
				$scope.vocabArray = Vocab.get({
					vocabId: $rootScope.$stateParams.vocabId
				}, function (vocab) {
					$scope.vocabAudios = new Array();
					$scope.vocabItems = vocab.content;
					$scope.totalItems = vocab.content.length;

					for (var i = 0; i < vocab.content.length; i++) {
						$scope.vocabAudios[i] = {
							id: vocab.content[i].id,
							howler: new Howl({
								src: vocab.content[i].urls
							})
						};
					}
				});

				//$scope.items = angular.copy($scope.datasource);
				$scope.flashitShowAnswerFeedback = true;
				$scope.flashItGameStarted = false;
				$scope.flashitCorrect = 0;
				$scope.flashitIncorrectScore = 0;
				$scope.flashitHighScore = 0;
				$scope.flashStartSpeedSlide = {
					min: 2,
					max: 15,
					step: 1
				};
				$scope.flashIncomplete = false;

				var scoreArray = FlashIT.get({
					vocabID: $rootScope.$stateParams.vocabId
				}, function (response) {
					$scope.flashitHighScore = response.correctAnswers;
					//console.log($scope.flashitHighScore);
				});

				$scope.range = true;

				$scope.flashStartTime = 10;

				$scope.flashLanguageFlip = false;
				var flashPreviousRandomPick;
				$rootScope.$on('preference', function (event, preference) {
					$scope.flashitCurrentGameText = $rootScope.preference.navs.writeit_previous.translation;

				});
				$scope.flashIncomplete = false;

				//array randomizer
				$scope.flashitArrayRandomizer = function (arrayToRandomize) {
					//randomize our array
					for (var i = arrayToRandomize.length - 1; i >= 0; i--) {

						var randomIndex = Math.floor(Math.random() * (i + 1));
						var itemAtIndex = arrayToRandomize[randomIndex];
						arrayToRandomize[randomIndex] = arrayToRandomize[i];
						arrayToRandomize[i] = itemAtIndex;
						//seeAttempts[i] = 0;//use this loop set all the counts to zero
					}
					return arrayToRandomize;
				};

				//pick a random question or phrase
				$scope.flashRandomizer = function () {
					//convert our object to an array so we can work with it
					var newArray = [];
					for (var key in $scope.vocabItems) {

						newArray.push($scope.vocabItems[key]);
					}
					return $scope.flashitArrayRandomizer(newArray);
				};


				//convert our data to an array
				$scope.vocabArray.$promise.then(function (result) {
					$scope.flashitContentRandom = $scope.flashRandomizer();
				});

				//select a number of possible incorrect answers and insert the correct answer, then shuffle
				$scope.flashitCreatePossibleAnswers = function (pickedAnswer) {

					//if ($scope.flashitContentRandom.length > 5) {
					//select 4 randoms
					var pick;
					var newArray = [];
					if ($scope.flashitContentRandom.length > 5) {
						var maxLoopLength = 4;
					} else {
						var maxLoopLength = $scope.flashitContentRandom.length - 1;
					}
					for (var i = 0; i < maxLoopLength; i++) {
						pick = Math.floor(Math.random() * $scope.flashitContentRandom.length);
						if ((pick != pickedAnswer)) {
							var skipThisOne = false;
							for (var ii = 0, x = newArray.length; ii < x; ii++) {
								skipThisOne = false;
								if (newArray[ii].id == $scope.flashitContentRandom[pick].id) {
									i--;
									skipThisOne = true;
									break;
								}

							}

							if (!skipThisOne) {
								newArray.push($scope.flashitContentRandom[pick]);
							}
						} else {
							i--;
						}
					}
					newArray.push($scope.flashitContentRandom[pickedAnswer]);
					return $scope.flashitArrayRandomizer(newArray);

				};

				$scope.refreshFlashItGame = function () {
					$scope.flashitGameTransitioning = false;
					$scope.flashItGameStarted = true;
					$scope.flashitCurrentGameText = $rootScope.preference.navs.flashit_currentgame.translation;


					//pick a random question
					var flashRandomPicker = function (previousPick) {
						var pick;
						for (var i = 0; i < 10; i++) {
							pick = Math.floor(Math.random() * $scope.flashitContentRandom.length);
							if (pick != previousPick) {
								return pick;
							}
						}

					};

					var flashRandomPick = flashRandomPicker(flashPreviousRandomPick);


					flashPreviousRandomPick = flashRandomPick;

					$scope.flashitSelectedQuery = $scope.flashitContentRandom[parseInt(flashRandomPick)];
					$scope.playAudio($scope.flashitSelectedQuery.id)
					//console.log($scope.flashitSelectedQuery);
					$scope.flashitPossibleanswers = $scope.flashitCreatePossibleAnswers(flashRandomPick);

				}

				$scope.callbackFunction2 = function () {
					return function (graph) {
						var svg = d3.select("svg#audioFlashitSVG");
						var donut = svg.selectAll("g.nv-pie").filter(
						function (d, i) {
							return i == 1;
						});

						// Inserting text
						donut.insert("text", "g")
						.text(60)
						.attr("class", "css-label-class")
						.attr("text-anchor", "middle")
						.attr("dy", 20);
					}
				};

				var colorArray2 = ['#d9534f', '#5cb85c'];
				$scope.colorFunction2 = function () {
					return function (d, i) {
						return colorArray2[i];
					};
				}

				function setflashitPieGraph(first, second) {
					$scope.flashitPieData = [
						{ key: "One", y: first },
						{ key: "Two", y: second }


					];
				}

				$scope.random = function () {

					//$scope.stacked = [];
					$scope.interval = 0;

					$scope.flashitCurrentInterval = $interval(function () {
						$scope.interval = ($scope.interval + 1) % $scope.flashStartTime;
						var type;
						var value = ($scope.interval / $scope.flashStartTime) * 100;



						if (value == 0) {
							value = 100;
						}

						if (value <= 30) {
							type = 'success';
						} else if (value <= 50) {
							type = 'info';
						} else if (value <= 80) {
							type = 'warning';
						} else {
							type = 'danger';

						}
						if (value == 100) {
							$scope.flashitAnswerFlashing = 'incorrect_icon_64_64.png';
							$scope.flashitShowAnswerFeedbackProcessor();
							$scope.resetFlashItGame();

						}

						$scope.flashitQuestionProgress = value;
						$scope.type = type;



					}, 1000);
				};

				$scope.beginFlashItGame = function () {
					$scope.flashitCorrect = 0;
					$scope.flashitIncorrectScore = 0;
					$scope.flashitCurrentGameText = $rootScope.preference.navs.writeit_previous.translation;
					$scope.flashitShowAnswerFeedback = true;
					$scope.refreshFlashItGame();
					$scope.flashitTimeLeft = 60;
					setflashitPieGraph(0, 0);
					$scope.flashitGameInterval = $interval(function () {
						$scope.flashitTimeLeft--;
						setflashitPieGraph((60 - $scope.flashitTimeLeft), $scope.flashitTimeLeft);


						var svg = d3.select("svg#audioFlashitSVG");
						var donut = svg.selectAll("g.nv-pie").filter(
						function (d, i) {
							return i == 1;
						});


						// Inserting text
						donut.select("text").text($scope.flashitTimeLeft);


						if ($scope.flashitTimeLeft == 0) {

							$interval.cancel($scope.flashitGameInterval);
							$scope.endFlashItGame();
						}
					}, 1000);
				}

				$scope.$on("$destroy", function () {
					if ($scope.flashItGameStarted) {
						$scope.endFlashItGame();
					}
				});

				$scope.startFlashitOver = function () {
					$scope.flashitGameEnded = false;
					$scope.flashItGameStarted = false;
					$scope.flashitQuestionProgress = 0;



				}

				$scope.endFlashItGame = function () {
					$scope.flashitGameEnded = true;
					//$interval.cancel($scope.flashitCurrentInterval);
					$interval.cancel($scope.flashitGameInterval);
					$scope.chatCollapsed = true;

				}

				$scope.resetFlashItGame = function () {
					$scope.flashitGameTransitioning = true;
					$scope.flashitQuestionProgress = 0;
					$scope.flashStartTime = (($scope.flashStartTime - 1) < 2) ? 2 : ($scope.flashStartTime - 1);

					var start = new Date().getTime();
					for (var i = 0; i < 1e7; i++) {
						if ((new Date().getTime() - start) > 10) {
							break;
						}
					}

					$scope.refreshFlashItGame();
				};

				$scope.processQuestionBeforeNew = function (selectedAnswer) {
					for (var i in $scope.flashitPossibleanswers) {
						if ($scope.flashitPossibleanswers[i].phrase == selectedAnswer.phrase) {
							$scope.flashitPossibleanswers[i].incorrectAnswer = true;
						} else {
							$scope.flashitPossibleanswers[i].incorrectAnswer = false;
						}

						if ($scope.flashitPossibleanswers[i].phrase == $scope.flashitSelectedQuery.phrase) {
							$scope.flashitPossibleanswers[i].correctAnswer = true;
						} else {
							$scope.flashitPossibleanswers[i].correctAnswer = false;
						}

					}
				};

				$scope.flashitShowAnswerFeedbackProcessor = function () {
					$scope.flashitShowAnswerFeedback = false;
					$timeout(function () {
						$scope.flashitShowAnswerFeedback = true;
					}, 2000);
				}

				$scope.flashitProcessAnswer = function (selectedAnswer) {

					$('.flashItAnswerButton').on('click', function () {
						$(this).removeClass("active");
						$(this).blur();
					});
					if (selectedAnswer.phrase == $scope.flashitSelectedQuery.phrase) {
						$scope.resetFlashItGame();
						$scope.flashitCorrect++;
						
						$scope.flashitAnswerFlashing = 'correct_icon2_64_64.png';
						$scope.flashitShowAnswerFeedbackProcessor();



					} else {
						$scope.flashitIncorrectScore++;
						$scope.processQuestionBeforeNew(selectedAnswer);
						$scope.resetFlashItGame();
						$scope.flashitAnswerFlashing = 'incorrect_icon_64_64.png';
						$scope.flashitShowAnswerFeedbackProcessor();
					}

					if ($scope.flashitCorrect > $scope.flashitHighScore) {
						$scope.flashitHighScore = $scope.flashitCorrect;
					}
						FlashIT.update(
						{
							vocabID: $rootScope.$stateParams.vocabId
						}, {
							correct: $scope.flashitHighScore,
							incorrect: $scope.flashitIncorrectScore,
							remaining: 0
						});

					

				
				};

			}

			init();


		}];

		return {
			restrict: 'EA', //Default in 1.3+
			scope: {
				play: '&'
			},
			controller: controller,
			templateUrl: '/public/js/directives/audio-flashit.html',
		};
	}]);

}());