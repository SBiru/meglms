'use strict';

angular.module('app')
.controller('ImportCourseController',
	[	'$scope',
		'$window',
		'$stateParams',
		'Import',
		'Alerts',
		function($scope, $window, $stateParams, Import, Alerts){

			var file;
			var originalData;
			$scope.data = null;	// after upload
			$scope.selected = null;	// file
			$scope.inProgress = false;	// upload
			$scope.complete = false;	// upload
			$scope.retrieving = false;	// retrieving previous upload
			$scope.fromPrevious = false;	// retrieving previous upload
			$scope.importAll = false;	// use original data from upload
			$scope.importComplete = false;	// import (after upload and selection)
			$scope.courseId = $stateParams.courseId;

			Import.getPreviousUploads().then(function(uploads) {
				$scope.previousUploads = uploads;
			});

			var reload = function() {
				$window.location.reload();
			};

			$scope.check = function(files) {
				if(!files.length) {
					return;
				}
				file = files[0];
				var type = 'unknown';
				$scope.selected = {
					'name': file.name,
					'type': file.name.substring(file.name.lastIndexOf('.'), file.name.length),
					'size': '~' + Math.round(file.size / 1000000) + 'MB',
					'ready': false
				};
				// add other types here
				switch($scope.selected.type) {
					case '.mbz':
						type = 'Moodle';
						$scope.selected.ready = true;
						break;
					default:
						type = (file.type)? file.type : 'unknown';
						break;
				}
				$scope.selected.type = type;
			};

			$scope.isReady = function() {
				return $scope.selected && $scope.selected.ready;
			};

			$scope.isBusy = function() {
				return $scope.inProgress || $scope.complete;
			};

			$scope.isIncluded = function(obj) {
				return obj.include === true || !obj.hasOwnProperty('include');
			};

			$scope.upload = function () {
				Import.keepAlive.start();
				if(!$scope.isReady()) {
					$scope.error = 'An error ocurred while checking compatibility. Please reload the page.';
					return;
				}
				Import.upload(
					file,
					$scope.selected.type,
					// on progress:
					function(evt) {
						$scope.inProgress = true;
						$scope.progress = parseInt(100.0 * evt.loaded / evt.total);
					},
					// on success:
					function(data) {
						originalData = angular.copy(data);
						$scope.data = data;
						$scope.complete = true;
						Import.keepAlive.stop();
					},
					// on error
					function() {
						Import.keepAlive.stop();
						$scope.error = 'An error ocurred while uploading file';
					}
				);
			};

			$scope.import = function() {
				$scope.importing = true;
				Import.keepAlive.start();
				var finalData = ($scope.importAll)? originalData : $scope.data;
				Import.import(finalData, $stateParams.courseId).then(
					function(){
						$scope.importComplete = true;
						Import.keepAlive.stop();
						reload();
					},
					function(error){
						$scope.error = 'An error ocurred while importing course. Message: ' + error.data.error;
					}
				);
			};

			$scope.selectFromPrevious = function(upload) {
				$scope.retrieving = true;
				Import.keepAlive.start();
				Import.fromPrevious(upload.mapFile).then(
					function(data){
						originalData = angular.copy(data);
						$scope.data = data;
						$scope.complete = true;
						Import.keepAlive.stop();
					},
					function(){
						Import.keepAlive.stop();
						$scope.error = 'The backup file could not be retrieved. Please reload and try again.';
					}
				);
			};

			$scope.discard = function(upload) {
				Alerts.danger(
					{
						title: 'Discard upload',
						content: 'Are you sure you want to discard this file? You will need to re-upload the file if discarded.',
						textOk: 'Yes, Discard File'
					},
					function(){
						Import.discard(upload.folder).then(function(){
							Import.getPreviousUploads().then(function(uploads) {
								$scope.previousUploads = uploads;
							});
						});
					}
				);
			};

			$scope.toggleInclude = function(obj) {
				if(!obj.hasOwnProperty('include')) {
					obj.include = false;
				} else {
					obj.include = !obj.include;
				}
			};

			$scope.toggleImportAll = function() {
				$scope.importAll = !$scope.importAll;
			};

			$scope.transcludedFunctions = {
				'isIncluded': $scope.isIncluded,
				'toggleInclude': $scope.toggleInclude
			};
		}
	]
);