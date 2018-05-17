'use strict';
(function(angular){
angular.module('app').directive('alertConfigMissingAttendance',function(){
    return {
        restrict:'A',
        templateUrl:'/public/views/directives/reports/alert-page/config/alert-config-missing-attendance.html',
        link:function(scope){
            scope.new = {};
            scope.alert.params.classes = scope.alert.params.classes || [];
            scope.addNew = function(new_){
                var class_ = new_.selectedClass;
                if(!class_) {
                    toastr.error('You must select a valid class');
                    return;
                };
                scope.alert.params.classes.push({
                    id:class_.id,
                    name:class_.name
                })
                scope.new = {};
                delete scope.alert.addingNew;
            }

            scope.removeClass = function(i){
                scope.alert.params.classes.splice(i,1);
            }
        }
    }
})
}(angular))