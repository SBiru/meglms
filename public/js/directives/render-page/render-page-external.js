'use strict';

angular.module('app')

/* Layout == 'external_link' */
.directive('renderPageExternal',
	[
		function() {
			return {
				restrict: 'E',
				scope: {
					page: '=',
					options: '=?'
				},
				templateUrl: '/public/views/directives/renderpage/renderpageexternal.html',
				link: function ($scope, $element) { }
			};
		}
	]
);