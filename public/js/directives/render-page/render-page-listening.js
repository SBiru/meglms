'use strict';

angular.module('app')

/* Layout == 'vocab' */
.directive('renderPageListening',
	[ '$sce',
		function($sce) {
			return {
				restrict: 'E',
				scope: {
					page: '=',
					options: '=?'
				},
				templateUrl: '/public/views/directives/renderpage/renderpagelistening.html',
				link: function ($scope, $element) {
					// {name} replaced with params:{'name':'some name'}
					var replaceParams = function(str, params) {
						return str.replace(/{([^}]+)}/g, function(fullStr, paramName) {
							return params[paramName];
						});
					};
					// params to be inserted into url for listening activity
					var url = 'http://dev.nimbleknowledge.com/english3/'+
						'Login/{email}/{firstName}/{nativeLang}/{targetLang}/{appName}/{course}/{lesson}/{exNumber}';

					$scope.iframe = $sce.trustAsResourceUrl(replaceParams(url, $scope.page.params));

				}
			};
		}
	]
);