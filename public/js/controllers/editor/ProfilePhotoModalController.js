appControllers.controller('ProfilePhotoModalController', ['$scope','UploadFile','$modalInstance',
    function($scope,UploadFile,$modalInstance){

        $scope.handle = function (dataURL) {
            if(dataURL.indexOf('base64,')>=0){
                UploadFile.imageData({
                  imageData:  dataURL.split('base64,')[1]
                },function(response){
                    $modalInstance.close(response.filename)
                });
            }

        };
        $scope.ok = function(){
            $scope.handle($scope.croppedImage);

        };

        $scope.cancel = function (){
            $modalInstance.dismiss('cancel');
        };
        $scope.onFileSelect = function($files){
            var file = $files[0];
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function($scope){
                    $scope.myImage=evt.target.result;
                });
            };
            reader.readAsDataURL(file);
        }


        $scope.myImage='';
        $scope.croppedImage='';

    }

]);


