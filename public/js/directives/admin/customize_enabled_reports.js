'use strict';
(function(angular){
    angular.module('app').directive("customizeEnabledReports",
        ['OrganizationV2',function(OrganizationV2){
            return{

                restrict:'E',
                templateUrl:'/public/views/directives/admin/customize_enabled_reports.html?v='+window.currentJsVersion,
                scope:{
                    isOpened:'=?',
                    enabledReports:'=?'
                },
                link:function(scope){
                    scope.cancel = function(){
                        scope.isOpened=false;
                    }
                }
            }
        }]
    )
}(angular))