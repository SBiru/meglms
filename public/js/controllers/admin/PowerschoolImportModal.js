'use strict';

angular.module('app')
.controller('PowerschoolImportModal',
	[	'$scope',
		'$modalInstance',
		'orgId',
		'Import',
		function($scope, $modalInstance, orgId, Import){

			var file = null;

			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};

			$scope.select = function(files) {
				$scope.error = null;
				if(!files.length) {
					return;
				}
				file = files[0];
				$scope.ready = true;
				$scope.filename = file.name;
				$scope.filesize = (file.size/1000000).toFixed(2);
			};

			$scope.import = function () {
				Import.keepAlive.start();
				if(!$scope.ready) {
					$scope.error = 'An error ocurred while checking compatibility. Please reload the page.';
					return;
				}
				$scope.importing = true;
				Import.uploadPowerschool(
					file,
					orgId,
					// on progress:
					function(evt) {},
					// on success:
					function(data) {
						$scope.dataFinished = data;
						$scope.finished = true;
					},
					// on error
					function(error) {
						$scope.importing = $scope.ready = false;
						file = null;
						Import.keepAlive.stop();
						$scope.error = error.error;
					},
					'no'
				);
			};

		}
	]
);
