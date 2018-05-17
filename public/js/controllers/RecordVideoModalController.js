appControllers.controller('RecordVideoModalController', [
    '$scope',
    '$modalInstance',
    'params',
    function($scope,$modalInstance,params) {

        $scope.cancel=cancel;
        $scope.$watch('videoData',function(data){
            if(data) $modalInstance.close(data);
        })
        function cancel(){
            $modalInstance.dismiss('cancel');
        }


    }
]);