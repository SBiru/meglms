'use strict';

angular.module('app')
.controller('GradebookModalGradeController',
	[	'$scope',
		'$modalInstance',
		'$stateParams',
		'params',
		'Gradebook',
		'Page',
		'UserV2',
		function($scope, $modalInstance, $stateParams, params, Gradebook, Page, UserV2){
			var original;
			$scope.enableCreditedAssignments = params.enableCreditedAssignments
			// closes modal
			var close = function(){
				$scope.saving = false;
				if(params.reload===false)
					$modalInstance.close(true);
				else
					window.location.reload();

			};

			$scope.params = params;
			$scope.addExemptComments = null;
			$scope.extraAttempt = false;
			$scope.score={};
			Page.get(
				{id: params.page.id, userId: params.student.id},
				function(page){
					$scope.page = page;
					$scope.isOverriden = $scope.params.page.isScoreOverride;
					//if($scope.isOverriden) {
					//	UserV2.getUser($scope.params.page.overrideBy).then(function(user){
					//		$scope.overridingUser = user;
					//	});
					//}
					$scope.isExempt = ($scope.params.page.exemptedBy) || $scope.params.page.isExempt;
					$scope.score.initial= $scope.params.page.score
					if(!$scope.isScored()){

						$scope.addScore();
					}
					original = {
						isExempt: $scope.isExempt,
						isCredited: params.page.isCredited,
						score: $scope.score.initial,
						extraAttempt: false
					};
				}
			);

			$scope.scoreAsPercent = function(){
				if(!$scope.score.initial) {
					return 0;
				}
				return Math.round(($scope.score.initial * 100) / params.page.maxScore);
			};

			$scope.isScored = function(){
				return $scope.score.initial !== null;
			};

			$scope.addScore = function(){
				$scope.addingScore = true;
				$scope.score.initial = 0;
			};

			$scope.exempt = function(value){
				if(value && !original.isExempt) {
					$scope.addExemptComments = '';
				}
				$scope.isExempt = value;
				$scope.score.initial = original.score;
			};
			$scope.showGiveExtra = function(){
				return ($scope.page && $scope.page.quiz && !$scope.isExempt && parseInt($scope.page.quiz.completedAttempts) >= parseInt($scope.page.quiz.allowedTakes)) || $scope.page.extraAttemptOption;
			}
			$scope.toggleExtraAttempt = function(){
				$scope.extraAttempt = !$scope.extraAttempt;
			};

			$scope.getMaxAttempts = function(){
				return ($scope.page.quiz.allowedTakes)? $scope.page.quiz.allowedTakes : 'unlimited';
			};

			$scope.canSave = function(){
				return !angular.equals(
					original,
					{
						isExempt: $scope.isExempt,
						isCredited: params.page.isCredited,
						score: $scope.score.initial,
						extraAttempt: $scope.extraAttempt
					}
				);
			};
			function  dontRequireSubmission(){
				return !$scope.page.quiz && !$scope.params.page.isExempt
			}
			$scope.save = function(){

				$scope.saving = true;
				if($scope.extraAttempt) {
					Gradebook.giveExtraAttempt(
						{pageId:$scope.page.id, userId:params.student.id},
						function(){
							close();
						});
				} else if($scope.isExempt) {
					Gradebook.exempt(
						$stateParams.classId || $scope.$root.classInfo.id,
						$scope.params.page.id,
						$scope.params.student.id,
						$scope.addExemptComments,
						false,
						params.page.isCredited
					).then(function(result){
						$scope.params.page.exemptedBy = result.exemptedBy;
						$scope.params.page.exemptedComments = result.exemptedComments;
						close();
					});
				} else {
					if(!$scope.isExempt && original.isExempt) {
						// if we get to this point, changes have happened, hence Save button is enabled
						// Student was exempt before changes. Unexempting..
						Gradebook.unexempt(
							$stateParams.classId || $scope.$root.classInfo.id,
							$scope.params.page.id,
							$scope.params.student.id
						).then(function(){
							$scope.params.page.exemptedBy = null;
							$scope.score.initial = original.score;
							close();
						});
					} else {
						if(dontRequireSubmission() && $scope.page.rubricId){
							$scope.$broadcast('gradeUsingRubric');
							return;
						}
						// was not AND is not exempt, saving score
						// change must have happened in overriding score input box
						if(parseInt($scope.score.initial) === 'NaN') {
							$scope.score.initial = 0;
						} else {
							$scope.score.initial = parseFloat($scope.score.initial);
						}
						$scope.params.page.scoreOverride = $scope.score.initial;
						Gradebook.overrideScore(
							$stateParams.classId || $scope.$root.classInfo.id,
							$scope.params.page.id,
							$scope.params.student.id,
							$scope.params.page.scoreOverride
						).then(function(){
							if($scope.params.student.units)
								$scope.params.student.units.totalScore += ($scope.params.page.scoreOverride - original.score);
							close();
						},function(){
							close();
						});

					}
				}
			};
			$scope.$root.$on('graderNonSubmittableFinished',close);

			$scope.cancel = function () {
				if($scope.isOverriden) {
					$scope.params.page.score = $scope.params.page.scoreOverride = original.score;
				} else {
					$scope.params.page.score = original.score;
				}
				$modalInstance.dismiss('cancel');
			};
		}
	]
);
