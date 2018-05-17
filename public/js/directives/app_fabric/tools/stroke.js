'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarStroke',['canvasInstances','fabricToolsActions',function(instances,fabricToolsActions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/stroke.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                scope.changeWidth = function(newWidth){
                    newWidth = parseFloat(newWidth);
                    if(_.isNaN(newWidth) || newWidth<0){
                        newWidth = 0
                        scope.width = newWidth;
                    }
                    fabricToolsActions.getActionsFor(scope.instanceId).setStrokeWidth(newWidth);
                }
                scope.changeColor = fabricToolsActions.getActionsFor(scope.instanceId).setStroke;
                if(instances[scope.instanceId].canvas._activeObject){
                    scope.width = instances[scope.instanceId].canvas._activeObject.getStrokeWidth();
                    scope.color = instances[scope.instanceId].canvas._activeObject.getStroke();
                }

            }
        }

    }])
}(angular))
