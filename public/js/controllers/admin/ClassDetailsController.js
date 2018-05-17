appControllers.controller('ClassDetailsButtonController', [
    '$scope',
    '$modal',
    function ($scope, $modal) {

        $scope.open = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/admin/modaleditclass.html',
                controller: 'ModalEditClassController',
                resolve:{
                    classid:function(){
                        return $scope.$root.$stateParams.classId
                    },
                    isAdminView:function(){
                        return true;
                    },
                    classInfo:function(){
                        return $scope.$root.$stateParams
                    }                    
                },
                size: 'lg',
                windowClass: 'class-details-window',
            });
        }

    }
]);

