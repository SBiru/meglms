appControllers.controller('FileUpload', ['$rootScope', '$scope', '$modal', 'Upload', 'Post', '$fileupload',
    function ($rootScope, $scope, $modal, Upload, Post, $fileupload) {
        $scope.fileupload = $fileupload;
        var controller = 'modalFileUploadController';

        $scope.open = function (content) {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/uploadfile-modal.html',
                controller: controller,
                size: 'lg',
                windowClass: 'email-modal-window',
            });
            $rootScope.FileUploadModal = modalInstance;
            $rootScope.FileUploadContent = content;
        }

        $scope.$watch('filesdropped', function () {
            $scope.upload($scope.filesdropped);
        });

        $scope.upload = function (files) {
            if (files && files.length) {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    Upload.upload({
                            url: '/filesupload/uploadany/',
                            fields: {
                                'contentId': $rootScope.$stateParams.contentId
                            },
                            file: file
                        })
                        .progress(function (evt) {
                            $scope.fileupload.progress = parseInt(100.0 * evt.loaded / evt.total);
                            $scope.fileupload.fileuploading = evt.config.file.name;
                        })
                        .success(function (data, status, headers, config) {
                            $scope.fileupload.data = data;
                            $scope.fileupload.uploadsuccess($rootScope.FileUploadContent);
                        })
                        .error(function () {
                            $scope.fileupload.data = {};
                            $scope.fileupload.progress = 0;
                        });
                }
            }
        };




    }


]);