'use strict';
(function(angular){
    angular.module('app').directive('alertTargetBehind',function(){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/reports/alert-page/targetbehind.html',
            scope:{
                data:'=?',
                tableHeader:'=?'
            }
        }
    })
}(angular))