'use strict';
(function(angular){

    angular.module('ngFabric').directive('fabricPreviewer',['FabricSharedInitializer','FabricActions','canvasInstances','fabricCanvasActions',function(initializer,FabricActions,canvasInstances,fabricCanvasActions){
        return{
            restrict:'E',
            scope:{
                previewId:'=',
                loadedCallback:'=?',
            },
            templateUrl:'/public/views/directives/app_fabric/fabric-content.html?v=' + window.currentJsVersion,
            link:function(scope,el){
                function initPreviewer(canvas,id){
                    if(!scope.previewId) return;

                    if (typeof canvas != 'object'){

                        if(scope.instanceId && scope.instanceId != id) fabricCanvasActions.dispose(scope.instanceId);
                        scope.instanceId = id || scope.instanceId;
                        initializer.init(initPreviewer,el);
                        return;
                    }
                    scope.instanceId = id || scope.instanceId;
                    var actions = FabricActions.getActionsFor(id);

                    actions.file.open(scope.previewId,function(){
                        setTimeout(function(){actions.canvasAction.disableControls()})
                        if(scope.loadedCallback)
                            setTimeout(function(){scope.loadedCallback()});
                    });
                    scaleToParentSize();
                }
                function scaleToParentSize(){

                }
                var unWatchId = scope.$watch('previewId',function(){
                    initPreviewer()
                });

                scope.$on('$destroy',cleanUp)

                function cleanUp(){
                    unWatchId();
                    fabricCanvasActions.dispose(scope.instanceId);

                }


            }
        }

    }])
}(angular))
