'use strict';
(function(angular){
    angular.module('app').directive('testSchoolsContent',['TestSchoolsModel',function(TestSchoolsModel){
        return {
            restrict: 'E',
            templateUrl:'/public/views/directives/admin/proficiency_test_schools/test_schools_content.html',
            link:function(scope,el){
                var $ = jQuery;
                scope.model = TestSchoolsModel;
                function init(id){
                    if(id && id!='new'){
                        scope.model.getSchool({id:id},null,function(){
                            setTimeout(function(){
                                $('.panel-default').matchHeight();
                            })

                        });

                    }

                }
                scope.save = function(){
                    scope.model.save()
                };
                scope.$watch('model.selectedSchoolId',init);


            }
        }
    }])
}(angular))