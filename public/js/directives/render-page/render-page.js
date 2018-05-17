'use strict';

angular.module('app')

/* Main directive. Selects correct type of page to render based on layout (see ng-switch in template) */
.directive('renderPage',
	[ 'Page',
		function(Page) {
			return {
				restrict: 'E',
				scope: {
					page: '=?',
					pageId: '=?',
					options: '=?'
				},
				templateUrl: '/public/views/directives/renderpage/renderpage.html',
				link: function ($scope, $element) {
					// if both page and pageId exist, page has priority
					if(!$scope.page && $scope.pageId) {
						Page.get(
							{id:$scope.pageId},
							function(page) {
								$scope.page = page;
							}
						);
					}

					// define empty 'options' if undefined
					// options:
					//   - preview (T/F)
					//   - blockPosts (T/F)
					//   - hideResponses (T/F)
					if(!$scope.options) {
						$scope.options = {};
					}

					$scope.tryPassword = function() {
						Page.get(
							{id:$scope.page.id, password:$scope.password},
							// success
							function(page) {
								$scope.page = page;
								$scope.incorrectPassword = false;
							},
							// fail
							function() {
								$scope.incorrectPassword = true;
							}
						);
					};
				}
			};
		}
	]
);
