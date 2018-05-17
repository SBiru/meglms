'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuCanvasSize',['FabricActions','fabricMenus','canvasInstances',function(FabricActions,fabricMenus,instances){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'canvas_size';
                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/image/canvas-size.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){

                        var actions = FabricActions.getActionsFor(scope.instanceId),
                            canvas = instances[scope.instanceId].canvas

                        $scope.width = canvas.width
                        $scope.height = canvas.height

                        $scope.ok = function(){
                            if(!($scope.width == canvas.width && $scope.height == canvas.height)){
                                actions.canvasAction.resize($scope.width,$scope.height);
                            }
                            return $instance.dismiss();
                        }
                    }]
                }
            }
        }

    }])
}(angular))
