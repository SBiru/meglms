'use strict';
(function(angular){
    angular.module('app').directive('alertAssignmentAvg',['$filter',function($filter){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/reports/alert-page/avgassignmentgrade.html',
            scope:{
                data:'=?',
                tableHeader:'=?'
            },
            link:function(scope,element){
                function init(data){
                    if(!data) return;
                    angular.forEach(scope.data,function(class_){
                        class_.assignmentCount = class_.assignments.length;
                        class_.assignments = $filter('orderBy')(class_.assignments,'name')
                    })
                }
                var unWatchData = scope.$watch('data',init)
                element.on('$destroy',function(){
                    unWatchData();
                    scope.$destroy();
                })
            }
        }
    }])
}(angular))