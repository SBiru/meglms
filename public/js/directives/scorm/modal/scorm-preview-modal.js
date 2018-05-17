(function () {
    angular.module('app').controller('ModalPreviewScormController', ['$scope', '$modalInstance', '$upload', 'ScormService', '$timeout', 'XmlToJsonConverter', 'Alerts',
        function ($scope, $modalInstance, $upload, ScormService, $timeout, XmlToJsonConverter, Alerts) {

            $scope.submit = function () {
                ScormService.updateMark($scope.page_id, $scope.scorm_course_id, $scope.userId, $scope.userMail).then(function (response) {
                    $modalInstance.close("true");
                });
            };
            $scope.cancel = function () {
                $modalInstance.close("true");
            };
        }

    ])
}());