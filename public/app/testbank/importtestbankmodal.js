'use strict';

angular.module('app.testbank')
.controller('ImportTestbankModal',
	[	'$scope',
		'$modalInstance',
		'Upload',
		'courses',
		function($scope, $modalInstance, Upload, courses) {

			var file;
			$scope.importing = false;
			$scope.courses = courses;
			$scope.courseId = courses[0].id;

			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};

			$scope.check = function(files) {
				if(!files.length) {
					return;
				}
				file = files[0];
				$scope.selected = {
					'name': file.name,
					'type': file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length),
					'ready': true
				};
				$scope.error = null;
				$scope.complete = false;
			};

			$scope.import = function(){
				if(!$scope.selected.ready || !$scope.selected.courseId) {
					return;
				}
				$scope.importing = true;
				Upload.upload({
					'url': '/api/courses/' + $scope.selected.courseId + '/testbanks',
					'fields': null,
					'file': file
				}).progress(function(evt){
					$scope.progress = parseInt(100.0 * evt.loaded / evt.total);
				}).success(function(data){
					$scope.data = data;
					$scope.complete = true;
				}).error(function(error){
					$scope.selected = null;
					$scope.importing = false;
					$scope.error = error.error;
				});
			};

		}
	]
);
