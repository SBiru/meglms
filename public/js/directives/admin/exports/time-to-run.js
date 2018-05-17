'use strict';
(function(angular){
    angular.module('app').directive("timeToRun",[function() {
        return {
            restrict:'E',
            templateUrl:'/public/views/partials/admin/exports/time-to-run.html?v='+window.currentJsVersion,
            scope:{
                preferences:'=?',
                prefix:'=?'
            },
            link:function(scope){

            }
        }
    }]);
}(angular));