'use strict';

angular.module('app')
.controller('GradebookModalTitleController',
	[	'$scope',
		'$modalInstance',
		'$stateParams',
		'$window',
		'Page',
		'params',
		function($scope, $modalInstance, $stateParams,$window,Page, params){
			var original = {};
			$scope.error = {}; // for each tab (.page, .exempt)
			$scope.params = params;
			$scope.title = params.page.name;
			$scope.href = '../singlepage/#/' + params.page.id;
			$scope.pageId = params.page.id;
			$scope.classId = $stateParams.classId;
			$scope.hideExempt = params.hideExempt;
			$scope.enableCreditedAssignments = params.enableCreditedAssignments
			$scope.pageOptions = {
				preview: true,
				hidePreviewAlert: true
			};

			$scope.page = {
				oldMaxScore:params.page.maxScore,
				newMaxScore:params.page.maxScore,
			}


			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};
			$scope.canSave = function(){
				return parseFloat($scope.page.newMaxScore) && $scope.page.newMaxScore>0 &&
					parseFloat($scope.page.oldMaxScore) && $scope.page.oldMaxScore>0
			}
			$scope.changeMaxPoints = function(){
				$scope.convert = {
					saving:true
				}
				Page.changeMaxPoints({
					id:$scope.pageId,
					newScore:$scope.page.newMaxScore,
					oldScore:$scope.page.oldMaxScore
				},function(){
					$scope.convert.saving = false;
					location.reload();
				},function(error){
					$scope.convert.saving = false;
					console.log(error);
				})
			}
			$scope.onExemptSave = function() {
				location.reload();
			};

		}
	]
);
