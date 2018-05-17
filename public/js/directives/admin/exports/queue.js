'use strict';
(function(angular){
    angular.module('app').directive("queue",[function() {
        return {
            restrict:'E',
            templateUrl:'/public/views/partials/admin/exports/queue.html?v='+window.currentJsVersion,
            scope:{
                pending:'=?',
                corrupted:'=?',
                exporting:'=?',
                exportNow:'=?',
                openErrorDetails:'=?'
            },
            link:function(scope){
                scope.openErrorDetails = scope.openErrorDetails||function(){};
            }
        }
    }]);
}(angular));