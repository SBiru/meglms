
appControllers.controller('modalFileFolderController', ['$rootScope', '$scope', '$modal', '$controller', '$modalInstance',
    function ($rootScope, $scope, $modal, $controller, $modalInstance) {

        $scope.cancel = function () {
            document.cookie = "from_SCORM=;expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
            $modalInstance.close($.cookie('url'));
            // $modalInstance.dismiss('cancel');
        }
    }
]);

appControllers.controller('modalFileFolder', ['$rootScope', '$scope', '$modal',
    function ($rootScope, $scope, $modal) {

        var controller = 'modalFileFolderController';

        $scope.open = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/filefolder-modal.html',
                controller: controller,
                size: 'lg',
                windowClass: 'email-modal-window',
            });
        }
    }
]);