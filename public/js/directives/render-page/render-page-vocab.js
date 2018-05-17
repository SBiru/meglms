'use strict';

angular.module('app')

/* Layout == 'listening' */
.directive('renderPageVocab',
	[
		function() {
			return {
				restrict: 'E',
				scope: {
					page: '=',
					options: '=?'
				},
				templateUrl: '/public/views/directives/renderpage/renderpagevocab.html',
				link: function ($scope, $element) {
					// audio playback
					$scope.play = function(urls) {
						var howler = new Howl({urls: urls});
						howler.play();
					};

					$scope.toggleStarred = function(phrase) {
						phrase.starred = !phrase.starred;
					};
				}
			};
		}
	]
);