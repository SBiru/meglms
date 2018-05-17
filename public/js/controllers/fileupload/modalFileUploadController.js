appControllers.controller('modalFileUploadController', ['$rootScope', '$scope', '$modal', '$controller', '$modalInstance', 'Upload', 'Post', '$fileupload',
    function ($rootScope, $scope, $modal, $controller, $modalInstance, Upload, Post, $fileupload) {
        $scope.fileupload = $fileupload;
        var tempArray1 = new Array;
        var tempArray2 = new Array;
        var tempArrayValue = 0;
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        }
        $scope.fileupload.uploadsuccess = function (content) {
            $scope.fileupload.progress = 0;
            if (typeof this.data === 'object'){
            if (typeof content.uploaderror !== 'undefined'){
            delete content.uploaderror;
            }
            /*
             // previous code
             content.showfilename = this.data.showfilename;
             content.realfilename = this.data.realfilename;
             content.uploadedfileid = this.data.fileid;*/
            tempArray1.push({
                "showfilename" : this.data.showfilename,
                "realfilename" : this.data.realfilename
            });
            content.files = tempArray1;
            tempArray2[tempArrayValue] = this.data.fileid;
            content.uploadedfileid = tempArray2;
            tempArrayValue++;
            }
            else{
            content.uploaderror = 1;
            /*
             // previous code
             if (typeof content.showfilename !== 'undefined'){
                    delete content.showfilename;
                    delete content.realfilename;
                    delete content.uploadedfileid;
          }*/
            if (typeof content.files !== 'undefined'){
                delete content.files;
                delete content.uploadedfileid;
            }
            }
            $modalInstance.close();
        }
    }
]);