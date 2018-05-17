'use strict';
(function(angular){
angular.module('app').directive('alertFinalExam',['$filter',function($filter){
    return{
        restrict:'E',
        templateUrl:'/public/views/directives/reports/alert-page/final_exam.html',
        scope:{
            data:'=?',
            tableHeader:'=?'
        },
        link:function(scope,element){
            function init(data){
                if(!data) return;

                angular.forEach(scope.data,function(class_){
                    class_.studentCount = Object.keys(class_.students).length;
                    class_.studentArray = []
                    angular.forEach(class_.students,function(s){class_.studentArray.push(s)});
                    class_.studentArray = $filter('orderBy')(class_.studentArray,'name')
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