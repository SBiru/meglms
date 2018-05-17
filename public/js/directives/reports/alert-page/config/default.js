'use strict';
(function(angular){
    angular.module('app').directive('alertConfigDefault',function(){
        return {
            restrict:'A',
            templateUrl:'/public/views/directives/reports/alert-page/config/alert-config-default.html'
        }
    })
}(angular))