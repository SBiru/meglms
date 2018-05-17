'use strict';
(function(angular){

    angular.module('ngFabric').directive('fabricContent',['FabricActions','canvasInstances',function(FabricActions,instances){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_fabric/fabric-content.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope,el){
                var canvas = el.find('canvas');

                canvas.attr('width',el.parent().outerWidth()+'px');
                canvas.attr('height',el.parent().outerHeight()+'px');
                scope.$root.$on('FABRIC_CANVAS_READY',canvasLoaded)

                function canvasLoaded(event,id){
                    var actions = FabricActions.getActionsFor(id);
                    scope.instanceId = id
                    instances[id].canvas.on('object:moving', function (e) {
                        var obj = e.target;
                        // if object is too big ignore
                        if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
                            return;
                        }
                        obj.setCoords();
                        // top-left  corner
                        if(obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0){
                            obj.top = Math.max(obj.top, obj.top-obj.getBoundingRect().top);
                            obj.left = Math.max(obj.left, obj.left-obj.getBoundingRect().left);
                        }
                        // bot-right corner
                        if(obj.getBoundingRect().top+obj.getBoundingRect().height  > obj.canvas.height || obj.getBoundingRect().left+obj.getBoundingRect().width  > obj.canvas.width){
                            obj.top = Math.min(obj.top, obj.canvas.height-obj.getBoundingRect().height+obj.top-obj.getBoundingRect().top);
                            obj.left = Math.min(obj.left, obj.canvas.width-obj.getBoundingRect().width+obj.left-obj.getBoundingRect().left);
                        }
                    });
                    angular.element(window).keydown(actions.canvasAction.keydown.bind(actions.canvasAction));
                    angular.element(window).keyup(actions.canvasAction.keyup.bind(actions.canvasAction));

                }

            }
        }

    }])
}(angular))
