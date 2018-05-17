//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayEssayStudent', [
        'Upload',

        function(Upload){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/students/essay.html',
                link:function($scope){
                    $scope.prepareQuestion=function(){
                        if($scope.question.attemptedanswers){
                            var json;
                            try{
                                json = JSON.parse($scope.question.attemptedanswers);
                            }catch(e){}
                            if(json){
                                $scope.question.text = json.text;
                                $scope.question.attemptedanswers = json.text;
                                $scope.question.uploadedFile = json.file
                            }
                        }
                        var default_ = {allow_text_response: true};
                        if($scope.question.extra){
                            $scope.question.extra = typeof $scope.question.extra =='object'?$scope.question.extra:JSON.parse($scope.question.extra);
                            if($scope.question.extra.allow_text_response === undefined)
                                $scope.question.extra.allow_text_response = true;
                        }
                        else $scope.question.extra = default_;
                        if($scope.question.uploadedFile){
                            $scope.question.extra.uploadedFile = $scope.question.uploadedFile
                            $scope.question.files = [{
                                name:$scope.question.extra.uploadedFile.realfilename
                            }]
                            $scope.uploaded = true;
                        }

                    };
                    $scope.fileSelected = function(files){
                        $scope.question.files = files;
                    }
                    $scope.getFile = function ($event){
                        var fileInput = angular.element($event.target).next();
                        fileInput.click();
                    };
                    $scope.upload = function(){
                        if(!$scope.question.files) return;
                        $scope.uploading = true;
                        $scope.progress_upload = 0;
                        var promise = Upload.upload({
                            url: '/filesupload',
                            file: $scope.question.files[0],
                        }).progress(function (evt) {
                            $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);

                        }).success(function(response) {
                            $scope.question.extra.uploadedFile = response;
                            $scope.uploading =false;
                            $scope.uploaded = true;
                        });
                    }
                    $scope.humanFileSize = function (bytes, si) {
                        var thresh = si ? 1000 : 1024;
                        if(Math.abs(bytes) < thresh) {
                            return bytes + ' B';
                        }
                        var units = si
                            ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
                            : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
                        var u = -1;
                        do {
                            bytes /= thresh;
                            ++u;
                        } while(Math.abs(bytes) >= thresh && u < units.length - 1);
                        return bytes.toFixed(1)+' '+units[u];
                    }
                }

            }
        }
    ]);
}());
