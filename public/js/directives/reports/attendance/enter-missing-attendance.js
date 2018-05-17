'use strict';
(function(angular) {
    angular.module('app').directive('enterMissingAttendance', function () {
        return {
            restrict: 'E',
            template: '<input-attendance-panel ng-if="ready" days="days"></input-attendance-panel>',
            link:function(scope,el,attr){
                function init(){
                    var studentId = scope.student.id,
                        report = {};
                    scope.getReport([studentId],{maxDate:scope.date,minDate:scope.date},report).then(function(){
                        setTimeout(function(){
                            report[studentId].show=true
                            scope.ready = true;
                            var name = scope.student.name
                            scope.student = report[studentId];
                            scope.student.name = name
                        },100)
                    },function(error){
                        toastr.error('Ops. Something went wrong. Please try to open the window again');
                    });
                    scope.isMissingTab = true;
                    scope.days = [1];
                    scope.selected.date = scope.date;
                    scope.selected.type = 'day'
                }
                init();
            }
        }
    })
}(angular));