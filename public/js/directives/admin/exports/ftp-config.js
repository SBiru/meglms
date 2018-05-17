'use strict';
(function(angular){
    angular.module('app').directive("ftpConfig",[function() {
        return {
            restrict:'E',
            templateUrl:'/public/views/partials/admin/exports/ftp-config.html?v='+window.currentJsVersion,
            scope:{
                preferences:'=?',
                prefix:'=?'
            },
            link:function(scope){

            }
        }
    }]);
}(angular));