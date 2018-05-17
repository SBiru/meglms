appControllers.controller('PostsSummaryIconController', ['$scope', '$modal',
    function ($scope, $modal) {

        $scope.open = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/post-summary/modal.html',
                controller: 'PostsSummaryController',
                size: 'lg',
                windowClass: 'posts-summary-modal-window',
            });
        }
    }
]);