'use strict';

angular.module('app')
/* Layout == 'content' */
.directive('renderPageContent',
	[ '$sce',
		function($sce) {
			return {
				restrict: 'E',
				scope: {
					page: '=',
					options: '=?'
				},
				templateUrl: '/public/views/directives/renderpage/renderpagecontent.html',
				link: function ($scope, $element) {
					// safe html (video, img, media, etc)
					$scope.page.content = $sce.trustAsHtml($scope.page.content);

					/*
					 * Allow/block responses (posts)
					 */
					$scope.allowsResponses = function() {
						return ($scope.page.allowVideo || $scope.page.allowText || $scope.page.allowUpload) && !$scope.options.blockPosts;
					};

					/*
					 * page has responses/posts?
					 */
					$scope.hasResponses = function() {
						return ($scope.page.responses) && !$scope.options.blockPosts;
					};

					/*
					 * open modal to submit new post response
					 */
					// $scope.newPost = function() {
					// 	return ($scope.page.responses) && !$scope.options.blockPosts;
					// };
				}
			};
		}
	]
);