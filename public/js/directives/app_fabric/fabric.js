'use strict';
//required angular, jQuery
(function(angular,$){
    var fabric;
    var LASTID = 0;
    angular.module('ngFabric',['ui.bootstrap','ngResource']).value('FABRIC_EXTENSIONS',[
        {
            url:"/public/js/directives/app_fabric/extensions/textarea.class.js",
            loaded:false
        },
        {
            url:"/public/js/directives/app_fabric/extensions/linearrow.class.js",
            loaded:false
        },
        {
            url:"/public/js/directives/app_fabric/extensions/util.Matrix.js",
            loaded:false
        },
        {
            url:"/public/js/directives/app_fabric/extensions/util.Guid.js",
            loaded:false
        }])
        .value('fabricAppConfig',{})
        .value('canvasInstances',{})
        .factory('FabricSharedInitializer',['FABRIC_EXTENSIONS','$rootScope','canvasInstances','fabricAppConfig',function(FABRIC_EXTENSIONS,$rootScope,canvasInstances,appConfig){
            return {
                init: function(success,el){
                    if(!appConfig.loaded){
                        $.getScript('/public/lib/fabric.js',loadExtensions)
                        appConfig.loaded = true;
                    }
                    else{
                        init();
                    }
                    function init(){
                        var canvasEl;
                        if(el){
                            canvasEl = el.find('canvas')[0];
                        }
                        var instanceId = ++LASTID;

                        canvasInstances[instanceId] = {
                            canvas:new window.fabric.Canvas(canvasEl || 'c',{ width: 800, height: 400 }),
                            config:{}
                        };
                        canvasInstances[instanceId].canvas.lowerCanvasEl.id = 'canvas_'+instanceId;
                        $rootScope.$emit('FABRIC_CANVAS_READY',instanceId);
                        if(success)
                            success(canvasInstances[instanceId],instanceId);
                    }

                    function loadExtensions(){
                        if(FABRIC_EXTENSIONS.length==0){
                            return init();
                        }
                        _.each(FABRIC_EXTENSIONS,function(e){
                            $.getScript(e.url,function(){
                                e.loaded = true;
                                checkLoadedAll()
                            });
                        })

                    }
                    function checkLoadedAll(){
                        for(var i =0;i<FABRIC_EXTENSIONS.length;i++){
                            if(!FABRIC_EXTENSIONS[i].loaded)
                                return;
                        }
                        init();
                    }
                }
            }

        }])
        .directive('fabricEditor',['FabricSharedInitializer','canvasInstances','fabricFileActions','fabricCanvasActions','fabricMenus','$modal',function(initializer,instances,fabricFileActions,fabricCanvasActions,fabricMenus,$modal){
        return{
            restrict:'A',
            template:'<div class="wrapper"><fabric-top-nav instance-id="instanceId"></fabric-top-nav ><fabric-nav instance-id="instanceId"></fabric-nav><fabric-content instance-id="instanceId"></fabric-content></div>',
            scope:{
                templateId:'=?',
                config:'=?'
            },
            link:function(scope,el,attrs){

                setTimeout(function(){initializer.init(function(canvas,id){
                    scope.instanceId = id;
                    instances[id].info = {};
                    instances[id].config = _.extend({},scope.config);
                    instances[id].properties = {};
                    if(scope.templateId){
                        fabricFileActions.getActionsFor(id).open(scope.templateId,function(){
                            if(scope.config.useStudentFilter){
                                instances[id].info.id = null;
                            }
                            scope.$root.saveFile = function(callBack){
                                $modal.open(
                                    _.extend({'windowClass':'modal-flat template-menu-modal'},fabricMenus['save'])
                                ).result.then(function(){
                                    if(callBack){
                                        callBack(instances[id])
                                    }
                                });
                            }
                        });
                    }

                    setTimeout(function(){scope.$apply()})
                })});
                scope.$on("$destroy",function(){
                    fabricCanvasActions.dispose(scope.instanceId)
                })
            }
        }

    }])

}(angular,jQuery))
