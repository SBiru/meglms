appControllers.controller('TeacherResponsesIconController', ['$scope', '$modal',
    function ($scope, $modal) {

        var controller = 'TeacherResponseController';

        $scope.open = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/teacher-responses/modal.html',
                controller: controller,
                size: 'lg',
                windowClass: 'teacher-responses-modal-window',
            });
        }
    }
]);