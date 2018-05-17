appControllers.controller('ProgressReportModalController', [
    '$scope',
    '$modalInstance',
    'orgid',
    function ($scope, $modalInstance,orgid) {
        $scope.orgId = orgid;


        $scope.cancel = function(){
            $modalInstance.dismiss('cancel');
        }
    }
]);