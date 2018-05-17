'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarDrawing',['canvasInstances','fabricToolsActions',function(instances,fabricToolsActions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/drawing.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                scope.changeBrushSize = function(newWidth){
                    newWidth = parseFloat(newWidth);
                    if(_.isNaN(newWidth) || newWidth<0){
                        newWidth = 0
                        scope.width = newWidth;
                    }
                    instances[scope.instanceId].canvas.freeDrawingBrush.width=newWidth;
                    fabricToolsActions.getActionsFor(scope.instanceId).setStrokeWidth(newWidth);
                }
                scope.changeBrushColor = function(newColor){
                    if(!instances[scope.instanceId].canvas.isDrawingMode){
                        scope.changeBrushColor =fabricToolsActions.getActionsFor(scope.instanceId).setStroke;
                    }
                    instances[scope.instanceId].canvas.freeDrawingBrush.color=newColor;
                }

                if(instances[scope.instanceId].canvas._activeObject){
                    scope.width = instances[scope.instanceId].canvas._activeObject.getStrokeWidth();
                    scope.color = instances[scope.instanceId].canvas._activeObject.getStroke();
                }
            }
        }

    }])
}(angular))
