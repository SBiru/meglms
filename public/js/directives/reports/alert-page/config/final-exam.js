'use strict';
(function(angular){
angular.module('app').directive('alertConfigFinalExam',function(){
    return {
        restrict:'A',
        templateUrl:'/public/views/directives/reports/alert-page/config/alert-config-final-exam.html',
        link:function(scope){
            scope.new = {};
            scope.alert.params.assignments = scope.alert.params.assignments || [];
            scope.addNew = function(new_){
                var assignment = new_.selectedAssignment;
                if(!assignment) {
                    toastr.error('You must select a valid assignment');
                    return;
                };
                scope.alert.params.assignments.push({
                    id:assignment.id,
                    name:assignment.name,
                    className:new_.selectedClass.name
                })
                scope.new = {};
                delete scope.alert.addingNew;
            }

            scope.removeAssignment = function(i){
                scope.alert.params.assignments.splice(i,1);
            }
        }
    }
})
}(angular))