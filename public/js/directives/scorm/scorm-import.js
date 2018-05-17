(function () {
    var apppp = angular.module('app');
    apppp.directive('scormImport', ['ScormService','Alerts','Cookiecutter','$modal','$q','$sce',
        function (ScormService,Alerts,Cookiecutter,$modal,$q,$sce) {
            return {
                restrict: 'E',
                scope: {
                    'scormConfig': '=?'
                },
                templateUrl: '/public/views/directives/scorm/scorm-import.html',
                link: function ($scope, $element) {
                    var url;
                    $scope.titleArray = [];
                    $scope.updateScormFile = function (file, event) {
                        $scope.scormConfig.scorm_file = file;
                    };
                    $scope.previewScorm = function () {

                        ScormService.getPreviewUrl($scope.scormConfig.scormCourseId).then(function (response) {
                            var preview_url = response.data.preurl;
                            $scope.final_preview_url = $sce.trustAsResourceUrl(preview_url);
                        });
                        var defer = $q.defer();
                        var modalInstance   = $modal.open({
                            templateUrl:'/public/views/directives/scorm/modal/scorm-preview.html',
                            controller: 'ModalPreviewScormController',
                            windowClass: 'scorm-preview',
                            id : 'scorm-preview',
                            backdrop: 'static',
                            scope: $scope
                        });
                        modalInstance.result.then(function(uploadScorm){
                            defer.resolve(uploadScorm);
                        });
                        return defer.promise;
                    };
                    $scope.editProperty = function(id){
                        var attr,attrVal;
                        if(id==0){
                            attr = document.getElementById("att").value;
                            attrVal = document.getElementById("attval").value;
                        }
                        if(id==1){
                            attr = document.getElementById("att1").value;
                            attrVal = document.getElementById("attval1").value;
                        }
                        ScormService.editAttripute($scope.scormConfig.scormCourseId,attr,attrVal).then(function (response) {
                            var val = response.data.url.length;
                            if(val == 0){
                                if(id==0){
                                    Alerts.danger({
                                        title:'Attribute not changed!!',
                                        content:'Attribute changing attempt was failed, probably you are trying with the existing settings, please try with alternate options.',
                                        textOk:'Ok'
                                    },function(){ });
                                }
                                else{
                                    Alerts.danger({
                                        title:'Attribute not changed!!',
                                        content:'probably you are trying with the existing settings, please try with alternate options otherwise This course may don\'t have any new version.',
                                        textOk:'Ok'
                                    },function(){ });
                                }
                            }
                            else{
                                Alerts.success({
                                    title:'Attribute changed!!',
                                    content:'Attribute changed successfully....',
                                    textOk:'Ok'
                                },function(){ });
                            }
                        })
                    };

                    $scope.openServerFiles = function(){
                        Cookiecutter.setcookie("from_SCORM",true);
                        var modalInstance = $modal.open({
                            templateUrl: '/public/views/partials/filefolder-modal.html',
                            controller: 'modalFileFolderController',
                            size: 'lg',
                            windowClass: 'email-modal-window'
                        });
                        modalInstance.result.then(function () {
                            var url = Cookiecutter.getCookiebyname('url');
                            if(url){
                                $scope.scormConfig.download_url = url;
                                Cookiecutter.delete_cookie('url')
                            }
                        })
                    }
                }
            }
        }
    ])
}());
