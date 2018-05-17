(function () {
    angular.module('app').controller('ModalUploadScormController', ['$scope', '$modalInstance', '$upload', 'ScormService', '$timeout', 'XmlToJsonConverter', 'Alerts',
        function ($scope, $modalInstance, $upload, ScormService, $timeout, XmlToJsonConverter, Alerts) {
            if (angular.isDefined($scope.importStatus) && $scope.importStatus.isSuccess) {
                console.log("SCORM file with title "+ $scope.scormConfig.scormTitle  +" already uploaded");
                modalClose();
            } else if (angular.isDefined($scope.scormConfig.scorm_file) && $scope.scormConfig.scorm_file.length > 0 || $scope.scormConfig.download_url) {
                if(!$scope.scormConfig.scorm_file){

                    var blob = null;
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", $scope.scormConfig.download_url, true);
                    xhr.responseType = "blob";//force the HTTP response, response-type header to be blob
                    xhr.onload = function()
                    {
                        blob = xhr.response;//xhr.response is now a blob object
                    }
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            if(xhr.response.type == "application/zip"){
                                blob = new File([xhr.response], "file.zip", {type: "application/zip", lastModified: new Date()});
                                $scope.scormConfig.scorm_file=blob;
                                upload();
                            }
                            else{
                                Alerts.danger({
                                    title:'ZIP file not available!!',
                                    content:'Please check the URL, given URL does\'nt contain .ZIP file.',
                                    textOk:'Ok'
                                },function(){ });
                                modalClose();
                            }
                        }
                        else if( xhr.readyState == 4 && xhr.status != 200){
                            Alerts.danger({
                                title:'Unable to download!!',
                                content:'Please check the URL.',
                                textOk:'Ok'
                            },function(){ });
                            modalClose();
                        }
                    }
                    xhr.send();
                }
                else{
                    upload();
                }
            } else {
                $scope.importStatus = {
                    progress: 0,
                    message: 'Unable to import SCORM file',
                    errorMessage: "No file selected, please select a file",
                    isFinished: true
                };
            }

            function upload(){
                ScormService.getUploadUrl($scope.scormConfig.scormCourseId).then(function (response) {
                    $scope.scormConfig.scormid = response.data.courseId;
                    console.log("SCORM file importing");
                    $upload.upload({
                        url: response.data.url,
                        data: {},
                        file: $scope.scormConfig.scorm_file
                    }).success(function (data) {
                        var uploadResponse = XmlToJsonConverter.stringXmlToJson(data);

                        if (uploadResponse.rsp.stat == 'ok') {
                            $scope.scormConfig.scorm_file = "";
                            getImportResult(uploadResponse.rsp.token.id["#text"])
                        } else {
                            $scope.scormConfig.scorm_file = "";
                            $scope.importStatus = {message: "unable to upload SCORM file"};
                            $scope.loading.addPage = 0;
                        }

                    }, function (error) {
                        console.warn(error);
                    });
                });
            }
            function getImportResult(scormtokenid) {
                ScormService.getUploadStatus(scormtokenid).success(function (data) {
                    var importProgress = angular.extend(data.rsp);
                    $scope.importStatus = {progress: angular.isDefined(importProgress.progress) ? importProgress.progress : 0};

                    updateProgressBar();

                    if (importProgress.status == "finished") {
                        importProgress.isFinished = true;
                        var length = importProgress.importresult.length - 1;
                        if(length >= 1)
                            $scope.importStatus.isSuccess = importProgress.importresult[length]['@attributes'].successful == 'true';
                        else
                            $scope.importStatus.isSuccess = importProgress.importresult['@attributes'].successful == 'true' ;
                        if ($scope.importStatus.isSuccess) {
                            $scope.importStatus.message = "Successfully imported SCORM package";
                            if(length >= 1)
                                $scope.scormConfig.scormTitle = importProgress.importresult[length].title;
                            else
                                $scope.scormConfig.scormTitle = importProgress.importresult.title;
                            $scope.scormConfig.scorm_file.length = "";
                            $scope.scormConfig.download_url = "";
                            modalClose();
                            return true;
                        } else {
                            if(length >=1 ){
                                $scope.importStatus.message = "Failed to import SCORM package. " + importProgress.importresult[length].message;
                                $scope.scormConfig.scormTitle = importProgress.importresult[length].message;
                            }
                            else{
                                $scope.scormConfig.scormTitle = importProgress.importresult.message;
                                $scope.importStatus.message = "Failed to import SCORM package. " + importProgress.importresult.message;
                            }
                            $scope.scormConfig.scorm_file.length = "";
                            $scope.scormConfig.download_url = "";
                            return false;
                        }
                    } else if (importProgress.status == "running") {
                        $scope.importStatus.progress = importProgress.progress;
                        $scope.importStatus.message = importProgress.message;
                        $timeout(function () {
                            getImportResult(scormtokenid);
                        }, 800);
                    } else {
                        $scope.importStatus.message = "Failed to import SCORM package";
                        return false;
                    }
                });
            }

            function updateProgressBar() {
                var progressBar = $('#upload-progress-bar.progress-bar');
                if (progressBar.length)
                    progressBar.width($scope.importStatus.progress + '%');
                console.log("SCORM import progress " + $scope.importStatus.progress + "%");
            }

            $scope.cancel = function () {
                $scope.loading.addPage = 0;
                $modalInstance.dismiss('cancel');
            };

            function modalClose() {
                $modalInstance.close("true");
            }
        }

    ]).service('XmlToJsonConverter', [function () {

        this.xmlToJson = function (xml) {

            // Create the return object
            var obj = {};

            if (xml.nodeType == 1) { // element
                // do attributes
                if (xml.attributes.length > 0) {
                    obj = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        obj[attribute.nodeName] = attribute.nodeValue;
                    }
                }
            } else if (xml.nodeType == 3) { // text
                obj = xml.nodeValue;
            }

            // do children
            if (xml.hasChildNodes()) {
                for (var i = 0; i < xml.childNodes.length; i++) {
                    var item = xml.childNodes.item(i);
                    var nodeName = item.nodeName;
                    if (typeof(obj[nodeName]) == "undefined") {
                        obj[nodeName] = this.xmlToJson(item);
                    } else {
                        if (typeof(obj[nodeName].push) == "undefined") {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(this.xmlToJson(item));
                    }
                }
            }
            return obj;
        };

        this.stringXmlToJson = function (xmlString) {
            var parser = new DOMParser();
            var xml = parser.parseFromString(xmlString, "text/xml");
            return this.xmlToJson(xml);
        };
    }
    ])
}());