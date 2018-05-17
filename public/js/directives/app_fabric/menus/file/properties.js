'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuProperties',['canvasInstances','fabricMenus',function(instances,fabricMenus){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'properties';
                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/file/properties.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){
                        instances[scope.instanceId].properties = instances[scope.instanceId].properties || {
                                studentCanEdit:false
                            }
                        $scope.instanceId = scope.instanceId
                        $scope.properties = _.clone(instances[scope.instanceId].properties);
                        $scope.save = function(){
                            instances[scope.instanceId].properties = _.extend({},instances[scope.instanceId].properties,$scope.properties);
                            $instance.dismiss()
                        }
                    }]
                }
            }
        }

    }])
}(angular))
