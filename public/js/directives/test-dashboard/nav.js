'use strict';
(function(angular){
    angular.module('app').directive('testDashboardNav',function(){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/test-dashboard/nav.html'
        }
    })
}(angular))
