'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuSave',['FabricActions','canvasInstances','fabricMenus','fabricMenuSaveShared',function(FabricActions,instances,fabricMenus,shared){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'save';

                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/file/saveas.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){
                        var actions = FabricActions.getActionsFor(scope.instanceId);
                        if(instances[scope.instanceId].info && instances[scope.instanceId].info.id){
                            actions.file.save();
                            setTimeout($scope.$close);
                        }
                        $scope.instanceId = scope.instanceId
                        shared.extend($scope);

                    }]
                }
            }
        }

    }]).factory('fabricMenuSaveShared',['canvasInstances','Class','FabricActions',function(instances,Class,FabricActions){
        return {
            extend: function($scope){
                var actions = FabricActions.getActionsFor($scope.instanceId);
                instances[$scope.instanceId].info = instances[$scope.instanceId].info || {}
                $scope.file = instances[$scope.instanceId].info;
                $scope.classes  = Class.query({
                        as:instances[$scope.instanceId].config.useStudentFilter?'student':'edit-teacher'
                    },function(classes){
                        $scope.classes = classes;
                    },function(error){
                        $scope.error = error.error;
                    }
                )
                $scope.save = function(){
                    actions.file.save(function(){
                        $scope.$close()
                    });
                }
            }
        }
    }])
}(angular))
