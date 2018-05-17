'use strict';

angular.module('app')

/* Layout == 'vocab-quiz' */
.directive('renderPageVocabQuiz',
	[
		function() {
			return {
				restrict: 'E',
				scope: {
					page: '=',
					options: '=?'
				},
				templateUrl: '/public/views/directives/renderpage/renderpagevocabquiz.html',
				link: function ($scope, $element) {
					$scope.getAllowedTakes = function() {
						return ($scope.page.allowedTakes)? $scope.page.allowedTakes : 'unlimited';
					};
				}
			};
		}
	]
);