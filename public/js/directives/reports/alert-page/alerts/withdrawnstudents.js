'use strict';
(function(angular){
angular.module('app').directive('alertWithdrawnStudents',['$filter',function($filter){
    return{
        restrict:'E',
        templateUrl:'/public/views/directives/reports/alert-page/withdrawnstudents.html',
        scope:{
            data:'=?',
            tableHeader:'=?'
        },
        link:function(scope,element){
            function init(data){
                if(!data) return;
                angular.forEach(scope.data,function(student){
                    student.classCount = Object.keys(student.classes).length;
                    student.classArray = []
                    angular.forEach(student.classes,function(c){student.classArray.push(c)});
                    student.classArray = $filter('orderBy')(student.classArray,'name')

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