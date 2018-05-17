'use strict';
(function(angular){
    angular.module('app').directive('alertAvgCourseGrade',function(){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/reports/alert-page/avgcoursegrade.html',
            scope:{
                data:'=?',
                tableHeader:'=?'
            }

        }
    })
}(angular))