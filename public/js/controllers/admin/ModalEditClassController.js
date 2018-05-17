appControllers.controller('ModalEditClassController',
    ['$scope','$modalInstance','classid','isAdminView','classInfo',
        function($scope,$modalInstance,classid,isAdminView,classInfo){
            $scope.classInfo = classInfo;
            $scope.classId = classid;
            $scope.isAdminView = isAdminView;
            $scope.isModalView = true;
            $scope.cancel = function(){
                $modalInstance.dismiss('cancel');
            }

        }
]);
