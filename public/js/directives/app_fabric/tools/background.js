'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarBackground',['canvasInstances','fabricToolsActions',function(instances,actions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/background.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                scope.changeColor = actions.getActionsFor(scope.instanceId).setFill;

                if(instances[scope.instanceId].canvas._activeObject){
                    scope.fillColor = instances[scope.instanceId].canvas._activeObject.getFill();
                }

            }
        }

    }])
}(angular))
