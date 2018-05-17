'use strict';
(function(angular){
    angular.module('app').directive('testTeacherDashboard',['Group','ProficiencyTestService',function(Group,ProficiencyTestService){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/test-dashboard/teacher-dashboard.html',
            link:function(scope){
                function getTestClasses(){
                    scope.groups = [];
                    ProficiencyTestService.getClasses({isE3PT:1}).$promise.then(function(classes){
                        scope.classes = classes;
                        if(classes.length>1)
                            scope.showSelectize = true;

                        scope.selectedClass = classFromUrlParam(scope.classes) ||scope.classes[0];
                    });

                }
                function classFromUrlParam(classes){
                    if(scope.$stateParams.classId){
                        return _.findWhere(classes,{id:scope.$stateParams.classId});
                    }
                }

                getTestClasses();

                scope.$watch('$root.user',function(user){
                    if(user && user.school_admin){
                        scope.schoolId = user.school_admin;
                    }
                })

            }
        }
    }])
}(angular))
