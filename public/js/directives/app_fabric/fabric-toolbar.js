'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbar',['canvasInstances',function(instances){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_fabric/fabric-toolbar.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                var AVAILABLE_TOOLS = {
                    stroke:'fabric-toolbar-stroke',
                    font:'fabric-toolbar-font',
                    background:'fabric-toolbar-background',
                    'stroke-shape':'fabric-toolbar-stroke-shape'
                }

                scope.hideToolbar = true;

                scope.addAttrAndCompile = function(attr,$event){
                    var el = angular.element($event.target);
                    el.attr(attr, '');
                    $compile(el)(scope);
                };

                function enableToolbar(event){
                    var object = event.target
                    scope.hideToolbar = false;
                    if(!object.tools){
                        return;
                    }
                    scope.tools = null;
                    setTimeout(function(){scope.$apply()})
                    setTimeout(function(){
                        scope.tools = _.filter(AVAILABLE_TOOLS,function(v,tool){
                            return object.tools.indexOf(tool)>=0;
                        })
                        setTimeout(function(){scope.$apply()})
                    })
                }
                function disableToolbar(){
                    scope.hideToolbar = true;
                    setTimeout(function(){scope.$apply()})
                }


                scope.$watch('config.canvas',function(){
                    if(scope.config && scope.config.canvas && scope.config.canvas.on){
                        instances[scope.instanceId].canvas.on('object:selected',enableToolbar)
                        instances[scope.instanceId].canvas.on('selection:cleared',disableToolbar)
                    }
                })
                scope.$watch('instanceId',function(id){
                    if(id)
                        scope.config = instances[scope.instanceId];
                })
                scope.$on('destroy',cleanUp)
                function cleanUp(){

                }

            }
        }

    }]).directive('fabricTool',['$compile',function($compile){
        return{
            restrict:'A',
            scope:{
                fabricTool:'=?',
                instanceId:'='
            },
            link:function(scope,el,attrs){
                el.append($compile('<div '+scope.fabricTool+' instance-id="instanceId"></div>')(scope));

            }
        }
    }])
}(angular))
