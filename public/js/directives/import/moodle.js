'use strict';

angular.module('app')
.directive('importTreeMoodle',
	[
		function() {
			return {
				restrict: 'E',
				scope: {
					data: '=',
					transcludedFunctions: '='
				},
				templateUrl: '/public/views/directives/importTreeMoodle.html',
				link: function ($scope, $element) {
					$scope.isIncluded = $scope.transcludedFunctions.isIncluded;
					$scope.toggleInclude = $scope.transcludedFunctions.toggleInclude;
				}
			};
		}
	]
);