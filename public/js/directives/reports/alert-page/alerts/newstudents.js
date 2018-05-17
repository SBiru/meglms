'use strict';
(function(angular){
    angular.module('app').directive('alertNewStudents',function(){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/reports/alert-page/notloggedin.html',
            scope:{
                data:'=?',
                tableHeader:'=?'
            },
            link:function(scope,element){
                function init(data){
                    if(!data) return;
                    scope.studentArray = _.map(data,function(s){return s});

                }
                var unWatchData = scope.$watch('data',init)
                element.on('$destroy',function(){
                    unWatchData();
                    scope.$destroy();
                })
            }
        }
    })
}(angular))