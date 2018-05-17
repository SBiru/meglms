'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarStrokeShape',['canvasInstances','fabricToolsActions',function(instances,fabricToolsActions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/strokeShape.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                var SHAPES = {
                    'full':null,
                    'dotted':[1,1],
                    'dashed-1':[3,3],
                    'dashed-2':[5,5],
                    'dashed-3':[7,7]
                }
                scope.availableShapes = SHAPES;
                scope.changeShape = function(shape){
                    fabricToolsActions.getActionsFor(scope.instanceId).strokeDashArray(shape);
                }
                scope.changeColor = fabricToolsActions.getActionsFor(scope.instanceId).setStroke;
                if(instances[scope.instanceId].canvas._activeObject){
                    var dashArray = instances[scope.instanceId].canvas._activeObject.strokeDashArray;
                    scope.shape = dashArray;
                }

            }
        }

    }])
}(angular))
