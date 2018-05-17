'use strict';
(function(angular){
angular.module('app').directive('testSchoolsLeftmenu',['TestSchoolsModel',function(TestSchoolsModel){
    return {
        restrict: 'E',
        templateUrl:'/public/views/directives/admin/proficiency_test_schools/test_schools_leftmenu.html',
        link:function(scope,el){
            scope.model = TestSchoolsModel;
            function init(){
                scope.model.getSchools();
            }

            scope.addNew = function(){
                scope.model.selectedSchoolId = 'new';
                scope.model.selectedSchool = scope.model.newSchool()
            }
            scope.removeSchool = function(schoolId,$event){
                scope.model.removeSchool({id:schoolId});
                $event.stopPropagation();
            }
            scope.selectSchool = function(id){
                scope.model.selectedSchoolId = id;
            }
            init();
        }
    }
}])
}(angular))