'use strict';

angular.module('app')

/* Layout == 'quiz' */
.directive('renderPageQuiz',
	[ '$sce',
		function($sce) {
			return {
				restrict: 'E',
				scope: {
					page: '=',
					options: '=?'
				},
				templateUrl: '/public/views/directives/renderpage/renderpagequiz.html',
				link: function ($scope, $element) {
					// safe html (video, img, media, etc)
					$scope.page.content = $sce.trustAsHtml($scope.page.content);
					$scope.page.quiz.description = $sce.trustAsHtml($scope.page.quiz.description);

					$scope.getAllowedTakes = function() {
						return ($scope.page.quiz.allowedTakes)? $scope.page.quiz.allowedTakes : 'unlimited';
					};
				}
			};
		}
	]
);