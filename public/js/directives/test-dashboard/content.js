'use strict';
(function(angular){
    angular.module('app').directive('testDashboard',['$compile',function($compile){
        return{
            restrict:'A',
            link:function(scope,element){
                var status = angular.copy(scope.$root.proficiencyTestStatus);

                function isStudent(){
                    return _.contains(status.proficiency.roles,'student');
                }

                var directiveEl;
                if(isStudent()){
                    directiveEl = "<div test-student-dashboard></div>"
                }else
                    directiveEl = "<div test-teacher-dashboard></div>"
                var compiled = $compile(directiveEl)(scope);
                element.append(compiled);
            }
        }
    }])
}(angular))
