'use strict';

angular.module('app')
.controller('ExemptStudentsModalController',
	[	'$scope',
		'$stateParams',
		'$modalInstance',
		'newPage',
		'currentClass',
		'exempt',
		function($scope, $stateParams, $modalInstance, newPage, currentClass, exempt){
			$scope.options = {
				newPage: newPage
			};
			$scope.classId = currentClass[0].id;
			$scope.exempt = exempt;
			$scope.pageId = $stateParams.contentId;

			$scope.onSave = function(students){
				$modalInstance.close(students);
			};
		}
	]
);