'use strict';
(function(angular){
    angular.module('ngFabric').value('fabricMenus',{}).directive('fabricTopNav',['fabricMenus','$modal','canvasInstances',function(fabricMenus,$modal,instances){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_fabric/fabric-top-nav.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                scope.openMenu = function(menu){
                    var menuOptions = fabricMenus[menu];
                    if(!menuOptions) return;
                    $modal.open(_.extend({
                        'windowClass':'modal-flat template-menu-modal'
                    },menuOptions))
                }
                scope.$watch('instanceId',function(id){
                    if(id)
                        scope.instance = instances[scope.instanceId];
                })
                scope.canSave = function(){
                    if(scope.instance && scope.instance.config.onlyOwnerCanSave){
                        return scope.instance.info.created_by == scope.$root.user.id
                    }
                    return true;
                }

            }
        }

    }])
}(angular))
