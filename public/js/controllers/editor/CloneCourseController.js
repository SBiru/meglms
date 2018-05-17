'use strict';

angular.module('app')
.controller('CloneCourseController',
	[	'$scope',
		'$window',
		'$stateParams',
		'$modal',
		'Course',
		'Clone',
		'Class',
		function($scope, $window, $stateParams,$modal, Course, Clone,Class){
			var reload = function() {
				$window.location.reload();
			};

			function openCloneQuizzesFlag(then){
				var modalInstance = $modal.open({
					templateUrl: '/public/views/partials/modalclonequizzesflag.html',
					controller: 'CloneQuizzesFlagController',

				});
				modalInstance.result.then(then);
			}
			function openClonePromptsFlag(then){
				var modalInstance = $modal.open({
					templateUrl: '/public/views/partials/modalclonepromptsflag.html',
					controller: 'ClonePromptsFlagController',

				});
				modalInstance.result.then(then);
			}

			$scope.courseId = $stateParams.courseId;
			Course.getTaught({includeInactive:1},function(response){
				$scope.courses = response.courses;
			});

			$scope.hasUnits = function() {
				return function(item){
					return parseInt(item['unitCount']) > 0;
				};
			};

			$scope.clone = function() {
				checkTimedReviews(function(response){
					if(response.hasTimedReview){
						openClonePromptsFlag(function(clonePrompts){
							openCloneQuizzesFlag(function(cloneQuizzes){
								finishCloning(cloneQuizzes,clonePrompts)
							})
						})
					}else{
						openCloneQuizzesFlag(finishCloning);
					}

				})

			};
			function finishCloning(cloneQuizzes,clonePrompts){
				$scope.message = 'Cloning course. Page will refresh automatically when finished. Please wait...';
				Clone.cloneCourse($scope.course, $scope.courseId,cloneQuizzes,clonePrompts).then(
					function(){
						reload();
					},
					function(){
						$scope.message = 'ERROR: Content could not be cloned. Please refresh the page and try again';
					}
				);
			}
			function checkTimedReviews(then){
				var selectedCourse = _.findWhere($scope.courses,{id:$scope.course});
				Class.containsTimedReview({id:selectedCourse.class_id},then)
			}
		}
	]
);