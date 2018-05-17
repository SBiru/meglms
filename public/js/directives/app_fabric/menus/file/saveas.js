'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuSaveas',['FabricActions','canvasInstances','fabricMenus','fabricMenuSaveShared','CurrentCourseId',function(FabricActions,instances,fabricMenus,shared,CurrentCourseId){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'saveas';
                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/file/saveas.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){
                        if(instances[scope.instanceId].info && instances[scope.instanceId].info.id){
                            instances[scope.instanceId].info.id=undefined;
                        }
                        instances[scope.instanceId].info.classId = CurrentCourseId.data.class_id || CurrentCourseId.data.classId
                        $scope.instanceId = scope.instanceId
                        shared.extend($scope);
                    }]
                }
            }
        }

    }])
}(angular))
