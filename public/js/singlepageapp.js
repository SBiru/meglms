'use strict';

angular.module('app',[
	'ngResource',
	'ngRoute',
	'ngSanitize',
	'ui.router',
	'ui.bootstrap'
])
.config(
	['$stateProvider',
		function ($stateProvider) {
			$stateProvider
			.state('home', {
				url: '/:pageId',
				templateUrl: '/public/views/singlepage/page.html',
				controller: 'SinglePageController'
			});
		}
	]
)
.controller('SinglePageController',
	[ '$scope',
		'$stateParams',
		'Page',
		function($scope, $stateParams, Page) {
			$scope.options = {
				preview: true
			};
			Page.get({'id':$stateParams.pageId}, function(result) {
				$scope.page = result;
			});
		}
	]
);